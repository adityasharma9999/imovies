import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import { movies, theatres, shows } from './routes/catalog.js';
import { Show } from './models/index.js';
import { errorHandler } from './utils/http.js';
import { MAX_SEATS, isValidSeat } from './utils/seats.js';
import * as locks from './utils/locks.js';

const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
const app = express();
app.use(cors({ origin: origins }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movies);
app.use('/api/theatres', theatres);
app.use('/api/shows', shows);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: origins } });
app.set('io', io);

const push = (showId) => io.to(`show:${showId}`).emit('show:locks', { showId, locks: locks.snapshot(showId) });

io.use((socket, next) => {
  try { socket.data.userId = String(jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET).id); } catch { /* guest */ }
  next();
});

io.on('connection', (socket) => {
  const joined = new Set();
  const leave = (showId) => {
    if (socket.data.userId) locks.releaseUser(showId, socket.data.userId);
    socket.leave(`show:${showId}`); joined.delete(showId); push(showId);
  };
  socket.on('show:join', (showId) => {
    socket.join(`show:${showId}`); joined.add(showId);
    socket.emit('show:locks', { showId, locks: locks.snapshot(showId) });
  });
  socket.on('show:leave', (showId) => leave(showId));
  socket.on('seat:lock', async ({ showId, seat } = {}, cb = () => {}) => {
    try {
      const uid = socket.data.userId;
      if (!uid) return cb({ ok: false, error: 'Please log in to select seats.' });
      if (!isValidSeat(seat)) return cb({ ok: false, error: 'Invalid seat.' });
      if (await Show.exists({ _id: showId, bookedSeats: seat })) return cb({ ok: false, error: 'That seat is already booked.' });
      const r = locks.lock(showId, seat, uid, MAX_SEATS);
      if (r.ok) push(showId);
      cb(r);
    } catch { cb({ ok: false, error: 'Could not hold that seat. Try again.' }); }
  });
  socket.on('seat:unlock', ({ showId, seat } = {}) => {
    if (socket.data.userId) { locks.unlock(showId, seat, socket.data.userId); push(showId); }
  });
  socket.on('disconnect', () => joined.forEach(leave));
});

setInterval(() => locks.prune().forEach(push), 5000);

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies')
  .then(() => server.listen(port, () => console.log(`IMovies API running on http://localhost:${port}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
