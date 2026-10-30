import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const id = Schema.Types.ObjectId;

const userSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });
userSchema.set('toJSON', { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });

const movieSchema = new Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  genres: [String],
  language: { type: String, default: 'English' },
  duration: { type: Number, required: [true, 'Duration is required'], min: 1 },
  rating: { type: Number, min: 0, max: 10, default: 0 },
  releaseDate: { type: Date, required: [true, 'Release date is required'] },
  cast: [String],
  director: { type: String, default: '' },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

const theatreSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  city: { type: String, required: [true, 'City is required'], trim: true },
  address: { type: String, default: '' },
  amenities: [String],
}, { timestamps: true });

const showSchema = new Schema({
  movie: { type: id, ref: 'Movie', required: [true, 'Movie is required'] },
  theatre: { type: id, ref: 'Theatre', required: [true, 'Theatre is required'] },
  startTime: { type: Date, required: [true, 'Start time is required'] },
  format: { type: String, enum: ['2D', '3D', 'IMAX'], default: '2D' },
  prices: {
    standard: { type: Number, required: true, min: 0, default: 150 },
    premium: { type: Number, required: true, min: 0, default: 250 },
    recliner: { type: Number, required: true, min: 0, default: 400 },
  },
  bookedSeats: [String],
}, { timestamps: true });
showSchema.index({ movie: 1, startTime: 1 });

const bookingSchema = new Schema({
  reference: { type: String, unique: true },
  user: { type: id, ref: 'User', required: true },
  show: { type: id, ref: 'Show', required: true },
  movie: { type: id, ref: 'Movie', required: true },
  theatre: { type: id, ref: 'Theatre', required: true },
  seats: [String],
  amount: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

const paymentSchema = new Schema({
  booking: { type: id, ref: 'Booking', default: null },
  user: { type: id, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'refunded'], required: true },
  last4: String,
  txnId: String,
  reason: String,
}, { timestamps: true });

export const User = model('User', userSchema);
export const Movie = model('Movie', movieSchema);
export const Theatre = model('Theatre', theatreSchema);
export const Show = model('Show', showSchema);
export const Booking = model('Booking', bookingSchema);
export const Payment = model('Payment', paymentSchema);
