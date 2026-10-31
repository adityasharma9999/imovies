# IMovies

A full-stack movie ticket booking app. Browse movies, pick a theatre and showtime, choose seats on a live seat map, pay with a simulated card, and get a QR-code ticket. Includes an admin dashboard for managing movies, theatres, shows and bookings.

> **Demo project.** Payments are simulated. No real money is ever charged.

## Features

**For customers**
- Browse Now Showing and Coming Soon movies, search by title, filter by genre, and switch city
- Movie details with rating, cast, director, description and trailer link
- Guided 7-step booking: movie, theatre, showtime, seats, review, payment, ticket
- Live seat map that updates for everyone viewing the same show
- Seats are held for 5 minutes while you check out
- Demo card payment with success and declined outcomes
- Digital ticket with QR code and PNG download
- My Bookings with upcoming, previous and cancelled tabs, plus booking cancellation
- Profile editing (name, phone, password)

**For admins**
- Overview with totals for users, movies, theatres, bookings and demo revenue, and a 7-day revenue chart
- Add, edit and delete movies, theatres and shows
- View all bookings, users and payments (including failed and refunded ones)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt password hashing, user and admin roles |
| Tickets | `qrcode` on the server, canvas-based PNG export in the browser |

## Getting started

### Prerequisites
- Node.js 18 or newer
- A MongoDB database: local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone and install
```bash
git clone https://github.com/<your-username>/imovies.git
cd imovies

cd server && npm install
cd ../client && npm install
```

### 2. Configure the server
```bash
cd server
cp .env.example .env
```
Edit `server/.env`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/imovies` |
| `JWT_SECRET` | Long random string used to sign tokens | `a-long-random-string` |
| `CLIENT_URL` | Allowed web app origin(s), comma-separated | `http://localhost:5173` |

### 3. Load sample data
```bash
cd server
npm run seed
```
This **clears the database** and adds 8 movies, 4 theatres across Bhopal, Indore and Mumbai, five days of shows, and two accounts. Re-run it any time to reset.

### 4. Start both apps
```bash
# Terminal 1: API on http://localhost:5000
cd server && npm run dev

# Terminal 2: web app on http://localhost:5173
cd client && npm run dev
```
Open http://localhost:5173. In development, Vite proxies `/api` and `/socket.io` to the API, so the client needs no extra configuration.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@imovies.test` | `Admin@123` |
| User | `demo@imovies.test` | `Demo@123` |

You can also register your own account from the login page.

## How to use

### Book a ticket
1. Pick your city in the top bar.
2. Open a movie from the home page or **Movies**, then select **Book tickets**. You'll be asked to log in.
3. Choose a theatre, then a date and showtime.
4. Tap seats on the map (up to 8). Prices depend on the row: Standard (A to B), Premium (C to F), Recliner (G to H).
5. Review the booking, then continue to payment.
6. Pay with a test card (below). Your ticket opens with a QR code and a **Download ticket** button.

### Test cards
Any valid-looking card works, except one that simulates a decline. The payment page has buttons that fill these for you.

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |

Use any future expiry (e.g. `12/30`), any 3 or 4 digit CVV, and any name.

### Manage bookings
Go to **My Bookings** to view or download tickets. Cancel an upcoming booking and its seats are released immediately for other people; the demo payment is marked refunded.

### Use the admin dashboard
Log in as the admin and open **Admin** in the navbar (or go to `/admin`).
- **Movies, Theatres, Shows:** use *Add* for new items, or *Edit* and *Delete* on any row. A movie or theatre with upcoming shows can't be deleted until those shows are removed. A show with bookings can't be deleted until they're cancelled.
- **Adding posters:** paste an image URL in the movie form. Without one, a styled text poster is shown.
- **Bookings, Users, Payments:** read-only lists, except that regular users can be deleted.

## How live seat selection works

1. When you open the seat map, your browser joins a Socket.IO room for that show.
2. Tapping a seat sends `seat:lock`. The server holds it for you for 5 minutes and broadcasts `show:locks` so other viewers see it as held.
3. Leaving the page, disconnecting or timing out releases your seats.
4. At payment, the server confirms you still hold the seats, then claims them with an atomic MongoDB update. Two people can never book the same seat, even if they pay at the same moment.

Holds are stored in server memory, so run a single server instance. To scale to several instances, move the holds to Redis.

## API overview

All routes are under `/api`. Routes marked 🔒 need a `Bearer` token, and 🛡️ means admin only.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, 🔒 `GET /auth/me`, 🔒 `PUT /auth/me` |
| Movies | `GET /movies` (`?status=now\|soon&q=&genre=`), `GET /movies/:id`, 🛡️ `POST`, `PUT /:id`, `DELETE /:id` |
| Theatres | `GET /theatres` (`?city=`), `GET /theatres/cities`, 🛡️ `POST`, `PUT /:id`, `DELETE /:id` |
| Shows | `GET /shows` (`?movie=&theatre=&city=`), `GET /shows/:id`, 🛡️ `POST`, `PUT /:id`, `DELETE /:id` |
| Bookings | 🔒 `POST /bookings`, `GET /bookings/mine`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel` |
| Admin | 🛡️ `GET /admin/stats`, `/admin/users`, `/admin/bookings`, `/admin/payments`, `DELETE /admin/users/:id` |
| Health | `GET /health` |

**Socket.IO events:** the client sends `show:join`, `show:leave`, `seat:lock`, `seat:unlock`. The server sends `show:locks`, `show:booked`, `show:freed`.

## Project structure

```
imovies/
├── server/
│   └── src/
│       ├── index.js          Express app, Socket.IO, seat-lock events
│       ├── seed.js           Sample data
│       ├── middleware.js     JWT auth and admin guard
│       ├── models/           User, Movie, Theatre, Show, Booking, Payment
│       ├── routes/           auth, catalog, bookings, admin
│       └── utils/            seat layout, seat holds, error handling
└── client/
    └── src/
        ├── pages/            Home, Movies, MovieDetail, Book, TicketPage, ...
        ├── pages/admin/      Admin layout, overview and management pages
        ├── components/       Navbar, Stepper, SeatMap, Ticket, CrudPage, ...
        ├── context/          Auth and UI (toasts, confirm dialogs, city)
        ├── lib/              API client, socket, seat-lock hook, formatters
        └── styles.css        Design system
```

## Deployment

The API needs persistent WebSocket connections, so it can't run on Vercel's serverless functions. A typical setup:

- **Database:** MongoDB Atlas
- **API (`server/`):** Render, Railway or Fly.io. Set `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL`
- **Web app (`client/`):** Vercel or Netlify. Set `VITE_SERVER_URL` to the API's public URL (no trailing slash) and add a rewrite of all paths to `/index.html` so deep links work

`CLIENT_URL` on the API must exactly match the web app's URL, or the browser will block requests (CORS).

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` on start | Make sure MongoDB is running, or check `MONGO_URI` and Atlas network access |
| Movies page is empty | Run `npm run seed` in `server/` |
| "No upcoming shows" | Shows are seeded for the next 5 days. Re-run the seed, or add shows in Admin. Also check the selected city |
| Seats don't update live | Check the API is running and `CLIENT_URL` matches the web app's URL |
| "Your seat hold has expired" | Holds last 5 minutes. Go back and pick your seats again |
| Logged out unexpectedly | Tokens last 7 days, or `JWT_SECRET` changed |

## Known limitations

- Payments are a simulation only. There is no real payment provider
- Seat holds are in memory (single server instance)
- The seating layout is fixed at 8 rows by 10 seats for every screen
- No email delivery; tickets are viewed and downloaded in the app

## License

Released under the MIT License. Use it freely for learning and portfolio work.
