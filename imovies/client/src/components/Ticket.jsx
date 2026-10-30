import Poster from './Poster';
import { fmtLong, fmtTime, money } from '../lib/format';

export default function Ticket({ b }) {
  return (
    <div className={`ticket ${b.status === 'cancelled' ? 'void' : ''}`}>
      <div className="t-poster"><Poster movie={b.movie} /></div>
      <div className="t-main">
        <h2>{b.movie.title}</h2>
        <dl>
          <div><dt>Theatre</dt><dd>{b.theatre.name}, {b.theatre.city}</dd></div>
          <div><dt>Date</dt><dd>{fmtLong(b.show.startTime)}</dd></div>
          <div><dt>Time</dt><dd>{fmtTime(b.show.startTime)} ({b.show.format})</dd></div>
          <div><dt>Seats</dt><dd>{b.seats.join(', ')}</dd></div>
          <div><dt>Paid (demo)</dt><dd>{money(b.amount)}</dd></div>
        </dl>
      </div>
      <div className="t-qr">
        <img src={b.qr} alt={`QR code for booking ${b.reference}`} width="150" height="150" />
        <strong>{b.reference}</strong>
        {b.status === 'cancelled' && <span className="chip err">Cancelled</span>}
      </div>
    </div>
  );
}
