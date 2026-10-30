import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Ctx = createContext(null);
export const useUI = () => useContext(Ctx);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [city, setCityState] = useState(localStorage.getItem('imovies_city') || 'Bhopal');
  const n = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++n.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const close = (v) => { dialog.resolve(v); setDialog(null); };
  const setCity = (c) => { localStorage.setItem('imovies_city', c); setCityState(c); };

  useEffect(() => {
    if (!dialog) return;
    const h = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <Ctx.Provider value={{ toast, confirm, city, setCity }}>
      {children}
      {createPortal(
        <>
          <div className="toasts" aria-live="polite">
            {toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
          </div>
          {dialog && (
            <div className="overlay" onClick={() => close(false)}>
              <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h3>{dialog.title}</h3>
                <p>{dialog.message}</p>
                <div className="row end">
                  <button className="btn ghost" onClick={() => close(false)}>{dialog.cancelText || 'Keep it'}</button>
                  <button className={`btn ${dialog.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>{dialog.confirmText || 'Confirm'}</button>
                </div>
              </div>
            </div>
          )}
        </>, document.body)}
    </Ctx.Provider>
  );
}
