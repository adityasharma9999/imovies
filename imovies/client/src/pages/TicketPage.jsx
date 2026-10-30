import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useUI } from '../context/UI';
import { useFetch, Spinner, ErrorBox } from '../components/UI';
import Stepper from '../components/Stepper';
import Ticket from '../components/Ticket';
import { downloadTicket } from '../lib/downloadTicket';

export default function TicketPage() {
  const { id } = useParams();
  const isNew = useSearchParams()[0].get('new') === '1';
  const { toast } = useUI();
  const { data: b, loading, error, reload } = useFetch(() => api(`/bookings/${id}`), [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  return (
    <div className="container section narrow-lg">
      {isNew && <Stepper step={8} />}
      {isNew && <div className="alert ok"><strong>Booking confirmed!</strong> Show this QR code at the cinema entrance.</div>}
      <Ticket b={b} />
      <div className="row center-row">
        <button className="btn primary" onClick={() => downloadTicket(b).catch(() => toast('Could not create the image.', 'error'))}>Download ticket</button>
        <Link className="btn ghost" to="/bookings">My bookings</Link>
        <Link className="btn ghost" to="/">Back to home</Link>
      </div>
    </div>
  );
}
