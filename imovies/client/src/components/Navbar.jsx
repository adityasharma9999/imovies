import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { useUI } from '../context/UI';
import { api } from '../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { city, setCity, toast } = useUI();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => { api('/theatres/cities').then(setCities).catch(() => {}); }, []);
  const go = () => setOpen(false);
  const search = (e) => { e.preventDefault(); nav(`/movies?q=${encodeURIComponent(q.trim())}`); setQ(''); go(); };
  const out = () => { logout(); go(); nav('/'); toast('You’ve been logged out.'); };
  const link = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="nav">
      <div className="container nav-in">
        <Link to="/" className="logo" onClick={go}>I<span>Movies</span></Link>
        <select className="city" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Choose city">
          {[...new Set([city, ...cities])].map((c) => <option key={c}>{c}</option>)}
        </select>
        <form className="search" onSubmit={search} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies" aria-label="Search movies" />
        </form>
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? '✕' : '☰'}</button>
        <nav className={`links ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={link} onClick={go}>Home</NavLink>
          <NavLink to="/movies" className={link} onClick={go}>Movies</NavLink>
          {user && <NavLink to="/bookings" className={link} onClick={go}>My Bookings</NavLink>}
          {user && <NavLink to="/profile" className={link} onClick={go}>Profile</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={link} onClick={go}>Admin</NavLink>}
          {user
            ? <button className="btn ghost small" onClick={out}>Log out</button>
            : <Link className="btn primary small" to="/login" onClick={go}>Log in</Link>}
        </nav>
      </div>
    </header>
  );
}
