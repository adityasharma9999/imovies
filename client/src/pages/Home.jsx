import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useUI } from '../context/UI';
import { useFetch, Spinner, ErrorBox, Empty } from '../components/UI';
import MovieCard from '../components/MovieCard';
import Poster from '../components/Poster';
import { duration } from '../lib/format';

export default function Home() {
  const { city } = useUI();
  const now = useFetch(() => api('/movies?status=now'));
  const soon = useFetch(() => api('/movies?status=soon'));
  const theatres = useFetch(() => api(`/theatres?city=${encodeURIComponent(city)}`), [city]);

  if (now.loading) return <Spinner />;
  if (now.error) return <ErrorBox error={now.error} retry={now.reload} />;
  const hero = now.data.find((m) => m.featured) || now.data[0];

  return (
    <>
      {hero && (
        <section className="hero">
          <div className="hero-bg"><Poster movie={hero} wide /></div>
          <div className="container hero-in">
            <h1>{hero.title}</h1>
            <p className="hero-meta">
              {hero.rating > 0 && <span>★ {hero.rating.toFixed(1)}</span>}
              <span>{hero.genres.join(', ')}</span><span>{duration(hero.duration)}</span><span>{hero.language}</span>
            </p>
            <p className="hero-desc">{hero.description}</p>
            <div className="row">
              <Link className="btn primary lg" to={`/movies/${hero._id}/book`}>Book tickets</Link>
              {hero.trailerUrl && <a className="btn ghost lg" href={hero.trailerUrl} target="_blank" rel="noreferrer">Watch trailer</a>}
            </div>
          </div>
        </section>
      )}
      <div className="container">
        <section className="section">
          <div className="row between"><h2>Now showing</h2><Link to="/movies" className="link">See all</Link></div>
          {now.data.length ? <div className="grid">{now.data.slice(0, 10).map((m) => <MovieCard key={m._id} movie={m} />)}</div>
            : <Empty title="No movies showing yet" text="Check back soon for new releases." />}
        </section>
        {soon.data?.length > 0 && (
          <section className="section">
            <h2>Coming soon</h2>
            <div className="grid">{soon.data.map((m) => <MovieCard key={m._id} movie={m} soon />)}</div>
          </section>
        )}
        {theatres.data?.length > 0 && (
          <section className="section">
            <h2>Popular theatres in {city}</h2>
            <div className="grid-3">
              {theatres.data.map((t) => (
                <div className="card" key={t._id}>
                  <h3>{t.name}</h3><p className="muted">{t.address}</p>
                  <div className="chips">{t.amenities.map((a) => <span className="chip" key={a}>{a}</span>)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
