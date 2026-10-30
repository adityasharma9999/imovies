import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth';
import { useUI } from '../context/UI';
import { useFetch, Spinner, ErrorBox, Empty, PageHead } from '../components/UI';
import Poster from '../components/Poster';
import { fmtDate, fmtTime, money } from '../lib/format';
import { downloadTicket } from '../lib/downloadTicket';

export default function MyBookings() {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const { data, loading, error, reload } = useFetch(() => api('/bookings/mine'));
  const [tab, setTab] = useState('upcoming');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} retry={reload} />;

  const now = new Date();
  const groups = {
    upcoming: data.filter((b) => b.status === 'confirmed' && new Date(b.show.startTime) > now),
    previous: data.filter((b) => b.status === 'confirmed' && new Date(b.show.startTime) <= now),
    cancelled: data.filter((b) => b.status === 'cancelled'),
  };
  const list = groups[tab];

  const cancel = async (b) => {
    if (!(await confirm({ title: 'Cancel this booking?', message: `Seats ${b.seats.join(', ')} for ${b.movie.title} will be released. Your demo payment will be marked refunded.`, confirmText: 'Cancel booking', cancelText: 'Keep booking', danger: true }))) return;
    try { await api(`/bookings/${b._id}/cancel`, { method: 'PATCH' }); toast('Booking cancelled.'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const download = async (b) => { try { const full = await api(`/bookings/${b._id}`); await downloadTicket(full); } catch (e) { toast(e.message, 'error'); } };

  return (
    <div className="container section">
      <PageHead title={`Hi, ${user.name.split(' ')[0]}`} sub="Your tickets live here." />
      <div className="tabs">
        {Object.entries(groups).map(([k, v]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k[0].toUpperCase() + k.slice(1)} ({v.length})</button>)}
      </div>
      {list.length === 0
        ? <Empty title={data.length ? `No ${tab} bookings` : 'No bookings yet'} text="Find a movie you love and book your first seats." action="Browse movies" to="/movies" />
        : <div className="stack">{list.map((b) => (
          <article className="booking" key={b._id}>
            <Poster movie={b.movie} />
            <div className="b-info">
              <h3>{b.movie.title}</h3>
              <p className="muted">{b.theatre.name}, {b.theatre.city}</p>
              <p>{fmtDate(b.show.startTime)} at {fmtTime(b.show.startTime)}</p>
              <p>Seats: <strong>{b.seats.join(', ')}</strong> <span className="muted">({money(b.amount)})</span></p>
              <p className="muted small-t">Ref {b.reference}</p>
            </div>
            <div className="b-actions">
              <Link className="btn primary small" to={`/tickets/${b._id}`}>View ticket</Link>
              {b.status === 'confirmed' && <button className="btn ghost small" onClick={() => download(b)}>Download</button>}
              {tab === 'upcoming' && <button className="btn danger-ghost small" onClick={() => cancel(b)}>Cancel</button>}
            </div>
          </article>))}</div>}
    </div>
  );
}
