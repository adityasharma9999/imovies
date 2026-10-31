import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth';
import { useUI } from '../context/UI';
import { useFetch, Spinner, ErrorBox, Empty } from '../components/UI';
import Stepper from '../components/Stepper';
import SeatMap from '../components/SeatMap';
import Poster from '../components/Poster';
import { useSeatLocks } from '../lib/useSeatLocks';
import { CATEGORY_LABEL, categoryOf, priceOf, sortSeats } from '../lib/seats';
import { dayKey, duration, fmtDate, fmtLong, fmtTime, money } from '../lib/format';

export default function Book() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { city, toast } = useUI();
  const movie = useFetch(() => api(`/movies/${id}`), [id]);
  const shows = useFetch(() => api(`/shows?movie=${id}&city=${encodeURIComponent(city)}`), [id, city]);

  const [step, setStep] = useState(2);
  const [theatreId, setTheatreId] = useState(null);
  const [day, setDay] = useState(null);
  const [show, setShow] = useState(null);
  const seatState = useSeatLocks(show?._id, user._id);
  const { selected, expiresAt, toggle } = seatState;

  // Theatre / date structure from the show list
  const theatres = useMemo(() => {
    const m = new Map();
    (shows.data || []).forEach((s) => m.set(s.theatre._id, s.theatre));
    return [...m.values()];
  }, [shows.data]);
  const theatreShows = (shows.data || []).filter((s) => s.theatre._id === theatreId);
  const days = [...new Map(theatreShows.map((s) => [dayKey(s.startTime), s.startTime])).entries()];
  const dayShows = theatreShows.filter((s) => dayKey(s.startTime) === day);

  // Hold timer + expiry notice
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!expiresAt) { setLeft(null); return; }
    const t = () => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    t(); const i = setInterval(t, 1000); return () => clearInterval(i);
  }, [expiresAt]);
  const hadSeats = useMemo(() => ({ n: 0 }), []);
  useEffect(() => {
    if (hadSeats.n > 0 && selected.length === 0 && step >= 4 && step <= 6) { toast('Your seat hold expired. Please pick your seats again.', 'error'); setStep(4); }
    hadSeats.n = selected.length;
  }, [selected.length]); // eslint-disable-line

  if (movie.loading || shows.loading) return <Spinner />;
  if (movie.error || shows.error) return <ErrorBox error={movie.error || shows.error} retry={() => { movie.reload(); shows.reload(); }} />;
  const m = movie.data;
  const total = show ? selected.reduce((s, x) => s + priceOf(show, x), 0) : 0;

  const pickSeat = async (seat) => { const r = await toggle(seat); if (!r.ok) toast(r.error, 'error'); };
  const back = () => {
    if (step === 3) { setDay(null); setShow(null); }
    if (step === 4) setShow(null);
    if (step === 2) return nav(`/movies/${id}`);
    setStep(step === 4 ? 3 : step - 1);
  };
  const mmss = left == null ? '' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="container section">
      <div className="row between wrap">
        <div><h1 className="h-sm">{m.title}</h1><p className="muted">{duration(m.duration)}, {m.language}</p></div>
        <button className="btn ghost" onClick={back}>Back</button>
      </div>
      <Stepper step={step} />

      {step === 2 && (
        <section>
          <h2>Choose a theatre in {city}</h2>
          {theatres.length === 0 ? <Empty title={`No upcoming shows in ${city}`} text="Try another city from the menu at the top." action="Browse other movies" to="/movies" /> : (
            <div className="stack">{theatres.map((t) => (
              <button key={t._id} className="option" onClick={() => { setTheatreId(t._id); setDay(null); setStep(3); }}>
                <div><h3>{t.name}</h3><p className="muted">{t.address}</p><div className="chips">{t.amenities.map((a) => <span className="chip" key={a}>{a}</span>)}</div></div>
                <span className="btn primary small">Select</span>
              </button>))}</div>)}
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>Pick a date and time</h2>
          <p className="muted">{theatres.find((t) => t._id === theatreId)?.name}</p>
          <div className="dates">{days.map(([k, d]) => (
            <button key={k} className={`date ${day === k ? 'on' : ''}`} onClick={() => setDay(k)}>
              <small>{fmtDate(d, { weekday: 'short' })}</small><b>{new Date(d).getDate()}</b><small>{fmtDate(d, { month: 'short' })}</small>
            </button>))}</div>
          {day ? ['2D', '3D', 'IMAX'].map((f) => {
            const list = dayShows.filter((s) => s.format === f);
            return list.length ? (
              <div className="format-row" key={f}><span className="chip">{f}</span>
                <div className="times">{list.map((s) => <button key={s._id} className="time" onClick={() => { setShow(s); setStep(4); }}>{fmtTime(s.startTime)}</button>)}</div>
              </div>) : null;
          }) : <p className="muted">Choose a date to see showtimes.</p>}
        </section>
      )}

      {step === 4 && show && (
        <section className="seat-layout">
          <div>
            <h2>Select your seats</h2>
            <p className="muted">{fmtLong(show.startTime)}, {fmtTime(show.startTime)} ({show.format})</p>
            {seatState.loading ? <Spinner /> : <SeatMap booked={seatState.booked} othersHeld={seatState.othersHeld} selected={selected} onToggle={pickSeat} />}
          </div>
          <aside className="card summary sticky">
            <h3>Your seats</h3>
            <div className="prices">{Object.keys(CATEGORY_LABEL).map((c) => <span key={c}><i className={`seat free ${c}`} /> {CATEGORY_LABEL[c]} {money(show.prices[c])}</span>)}</div>
            {selected.length ? (
              <>
                <div className="chips">{sortSeats(selected).map((s) => <span className="chip gold" key={s}>{s}</span>)}</div>
                <div className="line total"><span>Total ({selected.length})</span><strong>{money(total)}</strong></div>
                {mmss && <p className="muted small-t">Seats are held for you: {mmss} left</p>}
              </>) : <p className="muted">Tap a seat to select it. You can pick up to 8.</p>}
            <button className="btn primary block" disabled={!selected.length} onClick={() => setStep(5)}>Continue</button>
          </aside>
        </section>
      )}

      {step === 5 && show && (
        <section className="review">
          <h2>Review your booking</h2>
          <div className="card review-card">
            <Poster movie={m} />
            <dl className="facts">
              <div><dt>Movie</dt><dd>{m.title}</dd></div>
              <div><dt>Theatre</dt><dd>{show.theatre.name}, {show.theatre.city}</dd></div>
              <div><dt>Date and time</dt><dd>{fmtLong(show.startTime)}, {fmtTime(show.startTime)} ({show.format})</dd></div>
              <div><dt>Seats</dt><dd>{sortSeats(selected).join(', ')}</dd></div>
            </dl>
          </div>
          <div className="card">
            {Object.keys(CATEGORY_LABEL).map((c) => {
              const s = selected.filter((x) => categoryOf(x) === c);
              return s.length ? <div className="line" key={c}><span>{CATEGORY_LABEL[c]} × {s.length}</span><span>{money(s.length * show.prices[c])}</span></div> : null;
            })}
            <div className="line total"><span>Total</span><strong>{money(total)}</strong></div>
          </div>
          {mmss && <p className="muted">Seats held for {mmss}</p>}
          <div className="row end"><button className="btn ghost" onClick={back}>Back</button>
            <button className="btn primary" disabled={!selected.length} onClick={() => setStep(6)}>Continue to payment</button></div>
        </section>
      )}

      {step === 6 && show && (
        <Payment show={show} seats={selected} total={total} mmss={mmss} onBack={back}
          onDone={(b) => { toast('Payment successful. Booking confirmed!'); nav(`/tickets/${b._id}?new=1`); }}
          onSeatsLost={() => setStep(4)} />
      )}
    </div>
  );
}

function Payment({ show, seats, total, mmss, onBack, onDone, onSeatsLost }) {
  const { toast } = useUI();
  const [f, setF] = useState({ name: '', cardNumber: '', expiry: '', cvv: '' });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const fill = (num) => setF({ name: 'Demo User', cardNumber: num, expiry: '12/30', cvv: '123' });

  const pay = async (e) => {
    e.preventDefault(); setErr('');
    const digits = f.cardNumber.replace(/\s/g, '');
    if (!f.name.trim()) return setErr('Enter the name on the card.');
    if (!/^\d{16}$/.test(digits)) return setErr('Enter a valid 16-digit card number.');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) return setErr('Enter expiry as MM/YY.');
    if (!/^\d{3,4}$/.test(f.cvv)) return setErr('Enter a valid CVV.');
    setBusy(true);
    try { onDone(await api('/bookings', { method: 'POST', body: { showId: show._id, seats, payment: { ...f, cardNumber: digits } } })); }
    catch (e2) {
      setErr(e2.message); toast(e2.message, 'error');
      if (e2.status === 409) onSeatsLost();
    } finally { setBusy(false); }
  };

  return (
    <section className="seat-layout">
      <form className="card" onSubmit={pay} noValidate>
        <div className="demo-banner">DEMO PAYMENT – NO REAL MONEY IS CHARGED</div>
        <h2>Payment</h2>
        <div className="row wrap"><button type="button" className="btn ghost small" onClick={() => fill('4242424242424242')}>Fill test card (succeeds)</button>
          <button type="button" className="btn ghost small" onClick={() => fill('4000000000000002')}>Fill test card (declines)</button></div>
        <label>Name on card<input value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="cc-name" /></label>
        <label>Card number<input inputMode="numeric" maxLength={19} value={f.cardNumber} placeholder="0000 0000 0000 0000" autoComplete="cc-number"
          onChange={(e) => set('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} /></label>
        <div className="two">
          <label>Expiry<input value={f.expiry} placeholder="MM/YY" maxLength={5} autoComplete="cc-exp"
            onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); set('expiry', v); }} /></label>
          <label>CVV<input inputMode="numeric" maxLength={4} type="password" value={f.cvv} autoComplete="cc-csc" onChange={(e) => set('cvv', e.target.value.replace(/\D/g, ''))} /></label>
        </div>
        {err && <div className="alert err" role="alert">{err}</div>}
        <div className="row end"><button type="button" className="btn ghost" onClick={onBack} disabled={busy}>Back</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(total)}`}</button></div>
      </form>
      <aside className="card summary sticky">
        <h3>Order summary</h3>
        <div className="line"><span>Seats</span><span>{sortSeats(seats).join(', ')}</span></div>
        <div className="line"><span>Show</span><span>{fmtTime(show.startTime)}</span></div>
        <div className="line total"><span>Total</span><strong>{money(total)}</strong></div>
        {mmss && <p className="muted small-t">Seats held: {mmss} left</p>}
      </aside>
    </section>
  );
}
