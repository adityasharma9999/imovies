import jwt from 'jsonwebtoken';
import { User } from './models/index.js';
import { ah, HttpError } from './utils/http.js';

export const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const protect = ah(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new HttpError(401, 'Please log in to continue.');
  let payload;
  try { payload = jwt.verify(h.slice(7), process.env.JWT_SECRET); }
  catch { throw new HttpError(401, 'Your session has expired. Please log in again.'); }
  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, 'Account not found. Please log in again.');
  req.user = user;
  next();
});

export const adminOnly = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Admins only.'));
