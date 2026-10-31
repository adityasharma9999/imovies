# IMovies

Movie ticket booking: React + Vite, Node/Express, MongoDB/Mongoose, JWT auth, Socket.IO live seat sync with temporary seat holds, demo payments and QR tickets.

## Run it
Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. API
cd server
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed              # sample movies, theatres, shows and two accounts
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173  (proxies /api and /socket.io to :5000)
```

Accounts created by the seed:
- Admin: admin@imovies.test / Admin@123
- User: demo@imovies.test / Demo@123

## Demo payments
No real money moves. Any valid-looking card succeeds, except card numbers ending in `0002` (e.g. 4000 0000 0000 0002), which are declined so you can demo the failure path. The payment screen has buttons that fill both test cards.

## How seat locking works
Selecting a seat sends `seat:lock` over Socket.IO. The server holds it for 5 minutes in memory and broadcasts `show:locks` to everyone viewing that show. Leaving the show, disconnecting or timing out releases the seats. At checkout the server re-checks your holds, then claims seats with an atomic MongoDB update, so two people can never book the same seat. Holds live in one Node process; for multiple server instances move them to Redis.

## Deploying
Set `VITE_SERVER_URL` for the client build to your API URL, and `CLIENT_URL` on the server to the site URL (comma-separated for several).

## Structure
- `server/src/models` – User, Movie, Theatre, Show, Booking, Payment
- `server/src/routes` – auth, catalog (movies/theatres/shows), bookings, admin
- `server/src/utils/locks.js` – seat holds; `server/src/index.js` – Express + Socket.IO
- `client/src/pages` – customer pages; `client/src/pages/admin` – admin; `client/src/components` – shared UI; `client/src/styles.css` – design system
