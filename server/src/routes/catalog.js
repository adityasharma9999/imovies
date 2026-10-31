import { Router } from 'express';
import { Movie, Theatre, Show } from '../models/index.js';
import { protect, adminOnly } from '../middleware.js';
import { ah, HttpError } from '../utils/http.js';

const admin = [protect, adminOnly];
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim()).filter(Boolean);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- Movies ----------
export const movies = Router();
movies.get('/', ah(async (req, res) => {
  const { status, q, genre } = req.query, now = new Date(), f = {};
  if (status === 'now') f.releaseDate = { $lte: now };
  if (status === 'soon') f.releaseDate = { $gt: now };
  if (q) f.title = new RegExp(escapeRe(q), 'i');
  if (genre) f.genres = genre;
  res.json(await Movie.find(f).sort(status === 'soon' ? { releaseDate: 1 } : { featured: -1, releaseDate: -1 }));
}));
movies.get('/:id', ah(async (req, res) => {
  const m = await Movie.findById(req.params.id);
  if (!m) throw new HttpError(404, 'Movie not found.');
  res.json(m);
}));
const movieBody = (b) => ({ ...b, genres: list(b.genres), cast: list(b.cast) });
movies.post('/', admin, ah(async (req, res) => res.status(201).json(await Movie.create(movieBody(req.body)))));
movies.put('/:id', admin, ah(async (req, res) => {
  const m = await Movie.findByIdAndUpdate(req.params.id, movieBody(req.body), { new: true, runValidators: true });
  if (!m) throw new HttpError(404, 'Movie not found.');
  res.json(m);
}));
movies.delete('/:id', admin, ah(async (req, res) => {
  if (await Show.exists({ movie: req.params.id, startTime: { $gt: new Date() } }))
    throw new HttpError(409, 'This movie has upcoming shows. Delete those shows first.');
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Theatres ----------
export const theatres = Router();
theatres.get('/', ah(async (req, res) => {
  const f = req.query.city ? { city: req.query.city } : {};
  res.json(await Theatre.find(f).sort({ name: 1 }));
}));
theatres.get('/cities', ah(async (_req, res) => res.json((await Theatre.distinct('city')).sort())));
const theatreBody = (b) => ({ ...b, amenities: list(b.amenities) });
theatres.post('/', admin, ah(async (req, res) => res.status(201).json(await Theatre.create(theatreBody(req.body)))));
theatres.put('/:id', admin, ah(async (req, res) => {
  const t = await Theatre.findByIdAndUpdate(req.params.id, theatreBody(req.body), { new: true, runValidators: true });
  if (!t) throw new HttpError(404, 'Theatre not found.');
  res.json(t);
}));
theatres.delete('/:id', admin, ah(async (req, res) => {
  if (await Show.exists({ theatre: req.params.id, startTime: { $gt: new Date() } }))
    throw new HttpError(409, 'This theatre has upcoming shows. Delete those shows first.');
  await Theatre.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Shows ----------
export const shows = Router();
shows.get('/', ah(async (req, res) => {
  const { movie, theatre, city, all } = req.query, f = {};
  if (movie) f.movie = movie;
  if (theatre) f.theatre = theatre;
  if (!all) f.startTime = { $gt: new Date() };
  let rows = await Show.find(f).sort({ startTime: 1 }).populate('theatre').populate('movie', 'title duration language');
  if (city) rows = rows.filter((s) => s.theatre?.city === city);
  res.json(rows);
}));
shows.get('/:id', ah(async (req, res) => {
  const s = await Show.findById(req.params.id).populate('theatre').populate('movie');
  if (!s) throw new HttpError(404, 'Show not found.');
  res.json(s);
}));
const showBody = (b) => { const { bookedSeats, ...rest } = b; return rest; };
shows.post('/', admin, ah(async (req, res) => res.status(201).json(await Show.create(showBody(req.body)))));
shows.put('/:id', admin, ah(async (req, res) => {
  const s = await Show.findByIdAndUpdate(req.params.id, showBody(req.body), { new: true, runValidators: true });
  if (!s) throw new HttpError(404, 'Show not found.');
  res.json(s);
}));
shows.delete('/:id', admin, ah(async (req, res) => {
  const s = await Show.findById(req.params.id);
  if (s?.bookedSeats.length && s.startTime > new Date())
    throw new HttpError(409, 'This show already has bookings. Cancel them first.');
  await Show.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
