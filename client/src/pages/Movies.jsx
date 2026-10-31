import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useFetch, Spinner, ErrorBox, Empty, PageHead } from '../components/UI';
import MovieCard from '../components/MovieCard';

const GENRES = ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Adventure', 'Family', 'Romance'];

export default function Movies() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '', genre = sp.get('genre') || '', tab = sp.get('tab') || 'now';
  const { data, loading, error, reload } = useFetch(
    () => api(`/movies?status=${tab}&q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}`), [q, genre, tab]);
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };

  return (
    <div className="container section">
      <PageHead title="Movies" sub={q ? `Results for “${q}”` : 'Pick a movie and book your seats in minutes.'} />
      <div className="tabs">
        <button className={tab === 'now' ? 'on' : ''} onClick={() => set('tab', '')}>Now showing</button>
        <button className={tab === 'soon' ? 'on' : ''} onClick={() => set('tab', 'soon')}>Coming soon</button>
      </div>
      <div className="chips scroll">
        <button className={`pill ${!genre ? 'on' : ''}`} onClick={() => set('genre', '')}>All genres</button>
        {GENRES.map((g) => <button key={g} className={`pill ${genre === g ? 'on' : ''}`} onClick={() => set('genre', g)}>{g}</button>)}
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox error={error} retry={reload} />
        : data.length ? <div className="grid">{data.map((m) => <MovieCard key={m._id} movie={m} soon={tab === 'soon'} />)}</div>
        : <Empty title="No movies found" text="Try a different search or genre." action="Clear filters" to="/movies" />}
    </div>
  );
}
