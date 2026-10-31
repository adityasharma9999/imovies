import { Router } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { Booking, Show, Payment } from '../models/index.js';
import { protect } from '../middleware.js';
import { ah, HttpError } from '../utils/http.js';
import { MAX_SEATS, isValidSeat, priceOf } from '../utils/seats.js';
import * as locks from '../utils/locks.js';

const r = Router();
r.use(protect);

const populate = (q) => q.populate('movie', 'title posterUrl duration language').populate('theatre', 'name city address').populate('show', 'startTime format');
const withQr = async (b) => {
  const o = b.toObject();
  o.qr = await QRCode.toDataURL(`IMOVIES|${b.reference}|${b.show?._id || b.show}|${b.seats.join(',')}`, { margin: 1, width: 240 });
  return o;
};
const broadcastLocks = (io, showId) => io.to(`show:${showId}`).emit('show:locks', { showId, locks: locks.snapshot(showId) });

// Demo payment: card numbers ending in 0002 are declined, everything else succeeds. No real money moves.
function simulatePayment(p = {}) {
  const digits = String(p.cardNumber || '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(digits)) return { ok: false, last4: '', reason: 'Enter a valid 16-digit card number.' };
  if (!p.name?.trim()) return { ok: false, last4: digits.slice(-4), reason: 'Enter the name on the card.' };
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(p.expiry || '');
  if (!m) return { ok: false, last4: digits.slice(-4), reason: 'Enter expiry as MM/YY.' };
  if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) return { ok: false, last4: digits.slice(-4), reason: 'This card has expired.' };
  if (!/^\d{3,4}$/.test(p.cvv || '')) return { ok: false, last4: digits.slice(-4), reason: 'Enter a valid CVV.' };
  if (digits.endsWith('0002')) return { ok: false, last4: '0002', reason: 'The (demo) bank declined this card.', declined: true };
  return { ok: true, last4: digits.slice(-4) };
}

r.post('/', ah(async (req, res) => {
  const { showId, payment } = req.body;
  const seats = [...new Set(req.body.seats || [])];
  if (!seats.length || seats.length > MAX_SEATS || !seats.every(isValidSeat))
    throw new HttpError(400, `Choose between 1 and ${MAX_SEATS} seats.`);
  const show = await Show.findById(showId);
  if (!show) throw new HttpError(404, 'Show not found.');
  if (show.startTime <= new Date()) throw new HttpError(400, 'This show has already started.');
  const uid = String(req.user._id), sid = String(show._id);
  if (locks.heldByOthers(sid, seats, uid).length || !locks.heldByUser(sid, seats, uid))
    throw new HttpError(409, 'Your seat hold has expired. Please pick your seats again.');

  const amount = seats.reduce((sum, s) => sum + priceOf(show, s), 0);
  const result = simulatePayment(payment);
  const txnId = 'DEMO-' + crypto.randomBytes(5).toString('hex').toUpperCase();
  if (!result.ok) {
    await Payment.create({ user: req.user._id, amount, status: 'failed', last4: result.last4, txnId, reason: result.reason });
    throw new HttpError(402, result.reason);
  }
  // Atomically claim the seats; fails if anyone booked one in the meantime.
  const claimed = await Show.findOneAndUpdate(
    { _id: show._id, bookedSeats: { $nin: seats } }, { $push: { bookedSeats: { $each: seats } } }, { new: true });
  if (!claimed) throw new HttpError(409, 'Sorry, one of those seats was just booked. Please choose again.');

  const booking = await Booking.create({
    reference: 'IM-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    user: req.user._id, show: show._id, movie: show.movie, theatre: show.theatre, seats, amount,
  });
  await Payment.create({ booking: booking._id, user: req.user._id, amount, status: 'success', last4: result.last4, txnId });
  locks.release(sid, seats);
  const io = req.app.get('io');
  io.to(`show:${sid}`).emit('show:booked', { showId: sid, seats });
  broadcastLocks(io, sid);
  res.status(201).json(await withQr(await populate(Booking.findById(booking._id))));
}));

r.get('/mine', ah(async (req, res) => {
  res.json(await populate(Booking.find({ user: req.user._id }).sort({ createdAt: -1 })));
}));

r.get('/:id', ah(async (req, res) => {
  const b = await populate(Booking.findById(req.params.id));
  if (!b) throw new HttpError(404, 'Booking not found.');
  if (String(b.user) !== String(req.user._id) && req.user.role !== 'admin') throw new HttpError(403, 'This ticket belongs to someone else.');
  res.json(await withQr(b));
}));

r.patch('/:id/cancel', ah(async (req, res) => {
  const b = await Booking.findById(req.params.id).populate('show');
  if (!b || String(b.user) !== String(req.user._id)) throw new HttpError(404, 'Booking not found.');
  if (b.status === 'cancelled') throw new HttpError(400, 'This booking is already cancelled.');
  if (b.show.startTime <= new Date()) throw new HttpError(400, 'Past shows cannot be cancelled.');
  b.status = 'cancelled';
  await b.save();
  await Show.updateOne({ _id: b.show._id }, { $pull: { bookedSeats: { $in: b.seats } } });
  await Payment.updateOne({ booking: b._id, status: 'success' }, { status: 'refunded' });
  req.app.get('io').to(`show:${b.show._id}`).emit('show:freed', { showId: String(b.show._id), seats: b.seats });
  res.json(await withQr(await populate(Booking.findById(b._id))));
}));

export default r;
