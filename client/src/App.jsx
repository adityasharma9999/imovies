import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/Auth';
import Navbar from './components/Navbar';
import { Spinner } from './components/UI';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Book from './pages/Book';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import TicketPage from './pages/TicketPage';
import { AdminLayout, Overview } from './pages/admin/Admin';
import { MoviesAdmin, TheatresAdmin, ShowsAdmin, BookingsAdmin, UsersAdmin, PaymentsAdmin } from './pages/admin/pages';

function Guard({ admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

const Shell = () => (
  <>
    <Navbar />
    <main><Outlet /></main>
    <footer className="footer"><div className="container">IMovies is a college demo project. Payments are simulated and no real money is charged.</div></footer>
  </>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login mode="register" />} />
        <Route element={<Guard />}>
          <Route path="/movies/:id/book" element={<Book />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tickets/:id" element={<TicketPage />} />
        </Route>
        <Route path="*" element={<div className="container section"><h1>Page not found</h1><p className="muted">That page doesn’t exist. <a href="/">Go home</a></p></div>} />
      </Route>
      <Route element={<Guard admin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="movies" element={<MoviesAdmin />} />
          <Route path="theatres" element={<TheatresAdmin />} />
          <Route path="shows" element={<ShowsAdmin />} />
          <Route path="bookings" element={<BookingsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="payments" element={<PaymentsAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}
