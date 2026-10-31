import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Movie, Theatre, Show, Booking, Payment } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
await Promise.all([User, Movie, Theatre, Show, Booking, Payment].map((m) => m.deleteMany({})));

const day = 86400000, now = Date.now();
const yt = (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t + ' official trailer')}`;
await User.create([
  { name: 'Admin', email: 'admin@imovies.test', role: 'admin', passwordHash: await bcrypt.hash('Admin@123', 10) },
  { name: 'Demo User', email: 'demo@imovies.test', passwordHash: await bcrypt.hash('Demo@123', 10) },
]);

const m = (title, o) => ({ title, trailerUrl: yt(title), ...o });
const movies = await Movie.insertMany([
  m('Midnight Monsoon', { genres: ['Thriller', 'Drama'], language: 'Hindi', duration: 138, rating: 8.4, releaseDate: now - 10 * day, featured: true, director: 'Aarav Mehta', cast: ['Ishaan Verma', 'Tara Kapoor', 'Rohan Das'], description: 'During the worst storm in a decade, a night-shift train conductor finds a locked compartment that should not exist, and a passenger who has been waiting for him.' }),
  m('The Last Lighthouse', { genres: ['Adventure', 'Mystery'], language: 'English', duration: 121, rating: 7.9, releaseDate: now - 5 * day, director: 'Claire Hendry', cast: ['Mara Lindqvist', 'Owen Pike'], description: 'A retired keeper returns to a remote island lighthouse to uncover why its lamp lit itself every night for forty years.' }),
  m('Neon Samurai', { genres: ['Action', 'Sci-Fi'], language: 'Japanese', duration: 129, rating: 8.1, releaseDate: now - 20 * day, director: 'Kenji Ohara', cast: ['Haru Sato', 'Mika Tanabe'], description: 'In a rain-soaked megacity, an off-duty courier discovers an ancient blade hidden in a delivery and a clan hunting for it.' }),
  m('Chai & Chaos', { genres: ['Comedy', 'Family'], language: 'Hindi', duration: 115, rating: 7.4, releaseDate: now - 3 * day, director: 'Neha Joshi', cast: ['Kabir Malhotra', 'Anaya Rao', 'Pooja Iyer'], description: 'Three siblings reunite to save their late father\'s tea stall and accidentally start a city-wide food war.' }),
  m('Orbit Zero', { genres: ['Sci-Fi', 'Thriller'], language: 'English', duration: 142, rating: 8.7, releaseDate: now - 14 * day, director: 'Dana Whitfield', cast: ['Leo Marsh', 'Priya Nair', 'Jonas Weber'], description: 'A six-person crew wakes from hibernation to find their station has drifted, and one of them is not who they were.' }),
  m('Kadal Raja', { genres: ['Action', 'Drama'], language: 'Tamil', duration: 150, rating: 8.0, releaseDate: now - 8 * day, director: 'Selvam Murugan', cast: ['Vikram Anand', 'Divya Prakash'], description: 'A fisherman turned reluctant leader takes on the port mafia to protect his coastal village.' }),
  m('Dust Kingdom', { genres: ['Fantasy', 'Adventure'], language: 'English', duration: 133, rating: 0, releaseDate: now + 12 * day, director: 'Imani Brooks', cast: ['Zane Okafor', 'Elena Cruz'], description: 'A cartographer and a runaway prince cross a desert that rewrites itself each night.' }),
  m('Paper Moons', { genres: ['Romance', 'Drama'], language: 'Hindi', duration: 126, rating: 0, releaseDate: now + 25 * day, director: 'Riya Sen', cast: ['Aditya Bose', 'Meera Pillai'], description: 'Two strangers exchange letters through a misdelivered mailbox and fall for each other before ever meeting.' }),
]);

const theatres = await Theatre.insertMany([
  { name: 'Cinepolis Grand', city: 'Bhopal', address: 'DB Mall, Arera Hills', amenities: ['Dolby Atmos', 'Recliners', 'Food court'] },
  { name: 'PVR Aashima', city: 'Bhopal', address: 'Aashima Mall, Hoshangabad Road', amenities: ['4K Laser', 'Parking'] },
  { name: 'INOX Treasure', city: 'Indore', address: 'Treasure Island, MG Road', amenities: ['IMAX', 'Recliners'] },
  { name: 'Regal Starlight', city: 'Mumbai', address: 'Andheri West', amenities: ['IMAX', 'Dolby Atmos', 'Lounge'] },
]);

const times = [[10, 30], [13, 15], [16, 45], [20, 0], [22, 45]];
const shows = [];
movies.filter((mv) => mv.releaseDate <= now).forEach((mv, mi) => theatres.forEach((t, ti) => {
  for (let d = 0; d < 5; d++) times.forEach(([h, mn], k) => {
    if ((mi + ti + k + d) % 3 === 0) return; // vary the schedule
    const start = new Date(); start.setDate(start.getDate() + d); start.setHours(h, mn, 0, 0);
    if (start.getTime() <= now) return;
    shows.push({ movie: mv._id, theatre: t._id, startTime: start, format: k === 3 && ti % 2 ? 'IMAX' : k === 2 ? '3D' : '2D',
      prices: { standard: 150, premium: 250, recliner: 400 } });
  });
}));
await Show.insertMany(shows);
console.log(`Seeded ${movies.length} movies, ${theatres.length} theatres, ${shows.length} shows.`);
console.log('Admin: admin@imovies.test / Admin@123   User: demo@imovies.test / Demo@123');
await mongoose.disconnect();
