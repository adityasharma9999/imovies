import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useFetch, Spinner, ErrorBox } from '../components/UI';
import Poster from '../components/Poster';
import { duration, fmtLong } from '../lib/format';

export default function MovieDetail() {
  const { id } = useParams();
  const { data: m, loading, error, reload } = useFetch(() => api(`/movies/${id}`), [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const released = new Date(m.releaseDate) <= new Date();
  return (
    <>
      <section className="detail-hero">
        <div className="hero-bg"><Poster movie={m} wide /></div>
        <div className="container detail-in">
          <Poster movie={m} className="detail-poster" />
          <div>
            <h1>{m.title}</h1>
            <p className="hero-meta">
              {m.rating > 0 && <span>★ {m.rating.toFixed(1)} / 10</span>}
              <span>{duration(m.duration)}</span><span>{m.language}</span>
            </p>
            <div className="chips">{m.genres.map((g) => <span className="chip" key={g}>{g}</span>)}</div>
            <div className="row cta">
              {released
                ? <Link className="btn primary lg" to={`/movies/${m._id}/book`}>Book tickets</Link>
                : <button className="btn primary lg" disabled>Opens {fmtLong(m.releaseDate)}</button>}
              {m.trailerUrl && <a className="btn ghost lg" href={m.trailerUrl} target="_blank" rel="noreferrer">Watch trailer</a>}
            </div>
          </div>
        </div>
      </section>
      <div className="container section narrow">
        <h2>About the movie</h2>
        <p className="lead">{m.description || 'No description yet.'}</p>
        <dl className="facts">
          <div><dt>Release date</dt><dd>{fmtLong(m.releaseDate)}</dd></div>
          {m.director && <div><dt>Director</dt><dd>{m.director}</dd></div>}
          {m.cast.length > 0 && <div><dt>Cast</dt><dd>{m.cast.join(', ')}</dd></div>}
        </dl>
      </div>
    </>
  );
}
