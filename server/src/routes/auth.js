import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { protect, signToken } from '../middleware.js';
import { ah, HttpError } from '../utils/http.js';

const r = Router();
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

r.post('/register', ah(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name?.trim()) throw new HttpError(400, 'Please enter your name.');
  if (!emailOk(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user });
}));

r.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = emailOk(email) && (await User.findOne({ email: email.toLowerCase() }));
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash)))
    throw new HttpError(401, 'Incorrect email or password.');
  res.json({ token: signToken(user), user });
}));

r.get('/me', protect, (req, res) => res.json(req.user));

r.put('/me', protect, ah(async (req, res) => {
  const { name, phone, password } = req.body;
  if (name !== undefined) { if (!name.trim()) throw new HttpError(400, 'Name cannot be empty.'); req.user.name = name; }
  if (phone !== undefined) req.user.phone = phone;
  if (password) {
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
    req.user.passwordHash = await bcrypt.hash(password, 10);
  }
  await req.user.save();
  res.json(req.user);
}));

export default r;
