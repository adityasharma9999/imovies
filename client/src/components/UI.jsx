import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const Spinner = ({ label = 'Loading…' }) => <div className="center-pad"><div className="spinner" /><p className="muted">{label}</p></div>;

export const Empty = ({ title, text, action, to }) => (
  <div className="empty">
    <div className="empty-icon" aria-hidden>🎬</div>
    <h3>{title}</h3>
    {text && <p className="muted">{text}</p>}
    {action && <Link className="btn primary" to={to}>{action}</Link>}
  </div>
);

export const ErrorBox = ({ error, retry }) => (
  <div className="empty">
    <h3>We couldn’t load this</h3>
    <p className="muted">{error}</p>
    {retry && <button className="btn primary" onClick={retry}>Try again</button>}
  </div>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{children}</div>
);

export function Modal({ title, onClose, children }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

// Fetch helper hook
export function useFetch(fn, deps = []) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    set((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => alive && set({ data, error: null, loading: false }))
        .catch((e) => alive && set({ data: null, error: e.message, loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1), setData: (data) => set((s) => ({ ...s, data })) };
}
