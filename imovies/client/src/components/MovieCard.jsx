import { Link } from 'react-router-dom';
import Poster from './Poster';
import { duration, fmtDate } from '../lib/format';

export default function MovieCard({ movie, soon }) {
  return (
    <article className="movie-card">
      <Link to={`/movies/${movie._id}`} className="poster-wrap" aria-label={movie.title}>
        <Poster movie={movie} />
        {!soon && movie.rating > 0 && <span className="rating">★ {movie.rating.toFixed(1)}</span>}
      </Link>
      <h3 className="mc-title">{movie.title}</h3>
      <p className="mc-meta">{movie.genres.slice(0, 2).join(', ')}</p>
      <p className="mc-meta">{duration(movie.duration)} <span className="chip">{movie.language}</span></p>
      {soon
        ? <Link className="btn ghost block" to={`/movies/${movie._id}`}>Releases {fmtDate(movie.releaseDate, { day: 'numeric', month: 'short' })}</Link>
        : <Link className="btn primary block" to={`/movies/${movie._id}/book`}>Book tickets</Link>}
    </article>
  );
}
