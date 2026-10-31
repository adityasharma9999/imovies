import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import { useUI } from '../../context/UI';
import { api } from '../../lib/api';
import { useFetch, Spinner, ErrorBox, PageHead } from '../../components/UI';
import { fmtDate, money } from '../../lib/format';

const ITEMS = [['', 'Overview'], ['movies', 'Movies'], ['theatres', 'Theatres'], ['shows', 'Shows'], ['bookings', 'Bookings'], ['users', 'Users'], ['payments', 'Payments']];

export function AdminLayout() {
  const { logout } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="logo">I<span>Movies</span> <small>Admin</small></div>
        <nav>{ITEMS.map(([to, label]) => <NavLink key={to} to={`/admin/${to}`} end={to === ''}>{label}</NavLink>)}</nav>
        <button className="btn ghost small" onClick={() => { logout(); nav('/'); toast('You’ve been logged out.'); }}>Log out</button>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}

export function Overview() {
  const { data, loading, error, reload } = useFetch(() => api('/admin/stats'));
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const cards = [['Users', data.users], ['Movies', data.movies], ['Theatres', data.theatres], ['Bookings', data.bookings], ['Demo revenue', money(data.revenue)]];
  const max = Math.max(1, ...data.daily.map((d) => d.revenue));
  return (
    <>
      <PageHead title="Overview" sub="A quick look at how IMovies is doing." />
      <div className="stats">{cards.map(([k, v]) => <div className="card stat" key={k}><span className="muted">{k}</span><strong>{v}</strong></div>)}</div>
      <div className="card">
        <h3>Revenue, last 7 days</h3>
        <div className="chart" role="img" aria-label="Bar chart of demo revenue for the last 7 days">
          {data.daily.map((d) => (
            <div className="bar-col" key={d.date}>
              <span className="bar-val">{d.revenue ? money(d.revenue) : ''}</span>
              <div className="bar" style={{ height: `${(d.revenue / max) * 100}%` }} title={`${d.bookings} bookings`} />
              <small>{fmtDate(d.date, { weekday: 'short' })}</small>
            </div>))}
        </div>
      </div>
    </>
  );
}
