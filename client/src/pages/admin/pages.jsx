import { api } from '../../lib/api';
import { useUI } from '../../context/UI';
import { useFetch, Spinner, ErrorBox, Empty, PageHead } from '../../components/UI';
import CrudPage from '../../components/CrudPage';
import { fmtDate, fmtTime, money, toLocalInput } from '../../lib/format';

const csv = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

export const MoviesAdmin = () => (
  <CrudPage title="Movies" noun="Movie" endpoint="/movies"
    columns={[
      { label: 'Title', render: (d) => <strong>{d.title}</strong> }, { label: 'Language', render: (d) => d.language },
      { label: 'Genres', render: (d) => d.genres.join(', ') }, { label: 'Rating', render: (d) => d.rating || '-' },
      { label: 'Release', render: (d) => fmtDate(d.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' }) },
    ]}
    fields={[
      { key: 'title', label: 'Title', required: true }, { key: 'language', label: 'Language', default: 'English' },
      { key: 'duration', label: 'Duration (minutes)', type: 'number', required: true }, { key: 'rating', label: 'Rating (0-10)', type: 'number', step: '0.1', default: 0 },
      { key: 'releaseDate', label: 'Release date', type: 'date', required: true }, { key: 'genres', label: 'Genres', hint: 'Separate with commas' },
      { key: 'director', label: 'Director' }, { key: 'cast', label: 'Cast', hint: 'Separate with commas' },
      { key: 'posterUrl', label: 'Poster image URL', wide: true, hint: 'Optional. A styled poster is shown if empty.' },
      { key: 'bannerUrl', label: 'Banner image URL', wide: true }, { key: 'trailerUrl', label: 'Trailer link', wide: true },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'featured', label: 'Feature on homepage', type: 'checkbox' },
    ]}
    toForm={(d) => ({ ...d, genres: csv(d.genres), cast: csv(d.cast), releaseDate: d.releaseDate.slice(0, 10) })}
  />
);

export const TheatresAdmin = () => (
  <CrudPage title="Theatres" noun="Theatre" endpoint="/theatres"
    columns={[{ label: 'Name', render: (d) => <strong>{d.name}</strong> }, { label: 'City', render: (d) => d.city }, { label: 'Address', render: (d) => d.address }, { label: 'Amenities', render: (d) => d.amenities.join(', ') }]}
    fields={[
      { key: 'name', label: 'Name', required: true }, { key: 'city', label: 'City', required: true },
      { key: 'address', label: 'Address', wide: true }, { key: 'amenities', label: 'Amenities', wide: true, hint: 'Separate with commas' },
    ]}
    toForm={(d) => ({ ...d, amenities: csv(d.amenities) })}
  />
);

export const ShowsAdmin = () => (
  <CrudPage title="Shows" noun="Show" endpoint="/shows" listPath="/shows?all=1" loadExtras={async () => ({ movies: await api('/movies'), theatres: await api('/theatres') })}
    columns={[
      { label: 'Movie', render: (d) => <strong>{d.movie?.title}</strong> }, { label: 'Theatre', render: (d) => `${d.theatre?.name}, ${d.theatre?.city}` },
      { label: 'When', render: (d) => `${fmtDate(d.startTime)} ${fmtTime(d.startTime)}` }, { label: 'Format', render: (d) => d.format },
      { label: 'Booked', render: (d) => `${d.bookedSeats.length}/80` },
    ]}
    fields={[
      { key: 'movie', label: 'Movie', type: 'select', required: true, options: (x) => (x.movies || []).map((m) => ({ value: m._id, label: m.title })) },
      { key: 'theatre', label: 'Theatre', type: 'select', required: true, options: (x) => (x.theatres || []).map((t) => ({ value: t._id, label: `${t.name} (${t.city})` })) },
      { key: 'startTime', label: 'Start time', type: 'datetime-local', required: true },
      { key: 'format', label: 'Format', type: 'select', default: '2D', options: ['2D', '3D', 'IMAX'].map((v) => ({ value: v, label: v })) },
      { key: 'prices.standard', label: 'Standard price (₹)', type: 'number', default: 150, required: true },
      { key: 'prices.premium', label: 'Premium price (₹)', type: 'number', default: 250, required: true },
      { key: 'prices.recliner', label: 'Recliner price (₹)', type: 'number', default: 400, required: true },
    ]}
    toForm={(d) => ({ movie: d.movie?._id || d.movie, theatre: d.theatre?._id || d.theatre, startTime: toLocalInput(d.startTime), format: d.format, prices: { ...d.prices } })}
    fromForm={(f) => ({ ...f, startTime: new Date(f.startTime).toISOString() })}
  />
);

function ReadOnly({ title, sub, endpoint, columns, empty, onDelete }) {
  const { data, loading, error, reload } = useFetch(() => api(endpoint));
  const { toast, confirm } = useUI();
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  return (
    <>
      <PageHead title={title} sub={sub} />
      {!data.length ? <Empty title={empty} /> : (
        <div className="table-wrap"><table>
          <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}{onDelete && <th />}</tr></thead>
          <tbody>{data.map((d) => (
            <tr key={d._id}>{columns.map((c) => <td key={c.label} data-label={c.label}>{c.render(d)}</td>)}
              {onDelete && <td className="actions">{d.role !== 'admin' && <button className="btn danger-ghost small" onClick={async () => {
                if (!(await confirm({ title: 'Delete this user?', message: `${d.name} will lose access to their account.`, confirmText: 'Delete', danger: true }))) return;
                try { await api(`${endpoint.replace('/admin', '/admin')}/${d._id}`, { method: 'DELETE' }); toast('User deleted.'); reload(); } catch (e) { toast(e.message, 'error'); }
              }}>Delete</button>}</td>}</tr>))}</tbody>
        </table></div>)}
    </>
  );
}
const status = (s) => <span className={`chip ${s === 'confirmed' || s === 'success' ? 'ok' : s === 'cancelled' || s === 'failed' ? 'err' : ''}`}>{s}</span>;

export const BookingsAdmin = () => <ReadOnly title="Bookings" sub="Latest 200 bookings." endpoint="/admin/bookings" empty="No bookings yet"
  columns={[
    { label: 'Reference', render: (d) => d.reference }, { label: 'User', render: (d) => d.user?.name || 'Deleted user' }, { label: 'Movie', render: (d) => d.movie?.title },
    { label: 'Theatre', render: (d) => d.theatre?.name }, { label: 'Show', render: (d) => d.show ? `${fmtDate(d.show.startTime)} ${fmtTime(d.show.startTime)}` : '' },
    { label: 'Seats', render: (d) => d.seats.join(', ') }, { label: 'Amount', render: (d) => money(d.amount) }, { label: 'Status', render: (d) => status(d.status) },
  ]} />;

export const UsersAdmin = () => <ReadOnly title="Users" endpoint="/admin/users" empty="No users yet" onDelete
  columns={[{ label: 'Name', render: (d) => d.name }, { label: 'Email', render: (d) => d.email }, { label: 'Role', render: (d) => d.role }, { label: 'Joined', render: (d) => fmtDate(d.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) }]} />;

export const PaymentsAdmin = () => <ReadOnly title="Payments" sub="Demo payments only. No real money is charged." endpoint="/admin/payments" empty="No payments yet"
  columns={[
    { label: 'Transaction', render: (d) => d.txnId }, { label: 'User', render: (d) => d.user?.name || 'Deleted user' }, { label: 'Booking', render: (d) => d.booking?.reference || '-' },
    { label: 'Card', render: (d) => `•••• ${d.last4}` }, { label: 'Amount', render: (d) => money(d.amount) },
    { label: 'Status', render: (d) => status(d.status) }, { label: 'Note', render: (d) => d.reason || '' },
  ]} />;
