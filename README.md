# 🎬 iMovies

A full-stack web app for booking **movie tickets with live seat selection** and for **creating and booking events**: college fests, university programs, workshops and community meetups.

Built with the MERN stack (MongoDB, Express, React, Node.js), JWT authentication and Bootstrap.

<!-- Add screenshots: ![Home](docs/home.png) ![Seat map](docs/seats.png) ![Events](docs/events.png) -->

## Features

**Movies**
- Browse and search movies, then pick a showtime grouped by day
- Interactive seat map with available, selected and taken seats (auto-refreshes every 10 seconds)
- Atomic seat booking, so two users can never book the same seat

**Events (colleges, universities, meetups)**
- Any logged-in user can create an event with type, organization, venue, date, price (or free) and capacity
- Filter events by type and book 1 to 10 tickets
- Capacity is enforced atomically, so events can't be oversold
- Organizers can delete their events; bookings for a deleted event are cancelled

**Accounts and bookings**
- Register and log in with JWT; passwords are hashed with bcrypt
- "My tickets" page with booking codes and cancellation (releases seats or tickets)
- Admin role for adding movies and shows through the API

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, React Router, Bootstrap 5 |
| Backend | Node.js (16+), Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Deploy | Docker, Render (`render.yaml`) |

## Project structure

```
imovies/
├── server/
│   ├── index.js          # Express app, serves the built client in production
│   ├── models.js         # User, Movie, Show, Event, Booking
│   ├── auth.js           # JWT sign + auth/admin middleware
│   ├── seed.js           # Demo data
│   └── routes/index.js   # All API routes
├── client/
│   └── src/
│       ├── pages/        # Movies, MovieDetail, Seats, Events, CreateEvent, MyBookings, AuthPage
│       ├── api.js        # fetch helper
│       ├── auth.jsx      # Auth context
│       └── styles.css
├── Dockerfile
├── render.yaml
└── .env.example
```

## Getting started

### Prerequisites
- Node.js v16 or above and npm v8 or above
- MongoDB running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Setup

```bash
git clone https://github.com/<your-username>/imovies.git
cd imovies

cp .env.example .env        # then edit the values
npm run install-all
npm run seed                # optional demo data
```

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/imovies` |
| `JWT_SECRET` | Long random string used to sign tokens | `change-me` |

### Run in development

```bash
npm run dev:server    # API on http://localhost:5000
npm run dev:client    # App on http://localhost:5173 (proxies /api to the server)
```

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@imovies.com | admin123 |
| User | asha@campus.edu | student123 |

Change or delete these before any public deployment.

## API reference

Base path: `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create an account |
| POST | `/auth/login` | – | Log in, returns token |
| GET | `/auth/me` | User | Current user |
| GET | `/movies?q=` | – | List or search movies |
| GET | `/movies/:id` | – | Movie with upcoming shows |
| POST | `/movies` | Admin | Add a movie |
| POST | `/shows` | Admin | Add a show |
| GET | `/shows/:id` | – | Show with booked seats |
| GET | `/events?category=` | – | Upcoming events |
| POST | `/events` | User | Create an event |
| GET | `/events/mine` | User | Events you organize |
| GET | `/events/:id/attendees` | Organizer | Attendee list |
| DELETE | `/events/:id` | Organizer/Admin | Delete an event |
| POST | `/bookings/movie` | User | Book seats `{ showId, seats }` |
| POST | `/bookings/event` | User | Book tickets `{ eventId, quantity }` |
| GET | `/bookings/mine` | User | Your bookings |
| POST | `/bookings/:id/cancel` | User | Cancel a booking |

Example: add a show as admin

```bash
curl -X POST http://localhost:5000/api/shows \
  -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" \
  -d '{"movie":"<movieId>","theatre":"Screen 1","startsAt":"2026-11-05T18:30:00Z","price":250}'
```

## Deployment

Express serves the built React app, so a single service is enough.

**Render**
1. Push the repo to GitHub.
2. Create a Web Service from the repo (`render.yaml` is included).
3. Set `MONGO_URI` (Atlas) and `JWT_SECRET`.

**Docker**
```bash
docker build -t imovies .
docker run -p 5000:5000 --env-file .env imovies
```

**VPS**
```bash
npm run build && npm start
```

## Known limitations and roadmap

- Payments are simulated; integrate Razorpay or Stripe in `server/routes/index.js` before charging real money
- Seats are confirmed immediately (no timed hold during checkout)
- No admin UI yet for movies and shows (API only)
- Planned: email confirmations, QR-code tickets, event images, rate limiting

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Commit your changes and push the branch
3. Open a pull request describing the change

## License

MIT. Add a `LICENSE` file before publishing.
