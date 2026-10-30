import { ROWS, COLS, categoryOf } from '../lib/seats';

export default function SeatMap({ booked, othersHeld, selected, onToggle }) {
  return (
    <div className="seatmap-wrap">
      <div className="seatmap">
        <div className="screen"><span>Screen this way</span></div>
        {ROWS.map((r) => (
          <div className="seat-row" key={r}>
            <b className="row-label">{r}</b>
            {Array.from({ length: COLS }, (_, i) => {
              const id = `${r}${i + 1}`;
              const state = booked.has(id) ? 'booked' : othersHeld.has(id) ? 'held' : selected.includes(id) ? 'selected' : 'free';
              return (
                <button key={id} className={`seat ${state} ${categoryOf(id)} ${i === 4 ? 'gap' : ''}`}
                  disabled={state === 'booked' || state === 'held'} onClick={() => onToggle(id)}
                  aria-label={`Seat ${id}, ${categoryOf(id)}, ${state === 'free' ? 'available' : state === 'selected' ? 'selected' : 'unavailable'}`} aria-pressed={state === 'selected'} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i className="seat free" /> Available</span><span><i className="seat selected" /> Selected</span>
        <span><i className="seat held" /> Held by someone</span><span><i className="seat booked" /> Booked</span>
      </div>
    </div>
  );
}
