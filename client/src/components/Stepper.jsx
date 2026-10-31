export const STEPS = ['Movie', 'Theatre', 'Showtime', 'Seats', 'Review', 'Payment', 'Ticket'];
export default function Stepper({ step }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const n = i + 1, state = n < step ? 'done' : n === step ? 'now' : '';
        return <li key={s} className={state} aria-current={n === step ? 'step' : undefined}><b>{n < step ? '✓' : n}</b><span>{s}</span></li>;
      })}
    </ol>
  );
}
