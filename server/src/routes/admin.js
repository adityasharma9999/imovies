import { Router } from 'express';
import { User, Movie, Theatre, Booking, Payment } from '../models/index.js';
import { protect, adminOnly } from '../middleware.js';
import { ah, HttpError } from '../utils/http.js';

const r = Router();
r.use(protect, adminOnly);

r.get('/stats', ah(async (_req, res) => {
  const [users, movies, theatres, bookings] = await Promise.all([
    User.countDocuments(), Movie.countDocuments(), Theatre.countDocuments(), Booking.find({ status: 'confirmed' }).select('amount createdAt')]);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
  const daily = days.map((d) => {
    const end = new Date(d); end.setDate(end.getDate() + 1);
    const inDay = bookings.filter((b) => b.createdAt >= d && b.createdAt < end);
    return { date: d, bookings: inDay.length, revenue: inDay.reduce((s, b) => s + b.amount, 0) };
  });
  res.json({ users, movies, theatres, bookings: bookings.length, revenue: bookings.reduce((s, b) => s + b.amount, 0), daily });
}));

r.get('/users', ah(async (_req, res) => res.json(await User.find().sort({ createdAt: -1 }))));
r.delete('/users/:id', ah(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new HttpError(404, 'User not found.');
  if (u.role === 'admin') throw new HttpError(400, 'Admin accounts cannot be deleted here.');
  await u.deleteOne();
  res.json({ ok: true });
}));
r.get('/bookings', ah(async (_req, res) => res.json(await Booking.find().sort({ createdAt: -1 }).limit(200)
  .populate('user', 'name email').populate('movie', 'title').populate('theatre', 'name').populate('show', 'startTime'))));
r.get('/payments', ah(async (_req, res) => res.json(await Payment.find().sort({ createdAt: -1 }).limit(200)
  .populate('user', 'name email').populate('booking', 'reference'))));

export default r;
