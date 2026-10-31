import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth';
import { useUI } from '../context/UI';
import { PageHead } from '../components/UI';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', password: '' });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.name.trim()) return setErr('Name cannot be empty.');
    if (f.password && f.password.length < 6) return setErr('New password must be at least 6 characters.');
    setBusy(true);
    try { setUser(await api('/auth/me', { method: 'PUT', body: f })); toast('Profile updated.'); setEditing(false); setF({ ...f, password: '' }); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="container section narrow">
      <PageHead title="Profile" />
      <div className="card">
        {!editing ? (
          <>
            <dl className="facts">
              <div><dt>Name</dt><dd>{user.name}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Phone</dt><dd>{user.phone || 'Not added'}</dd></div>
            </dl>
            <div className="row"><button className="btn primary" onClick={() => setEditing(true)}>Edit profile</button>
              <button className="btn ghost" onClick={() => { logout(); nav('/'); toast('You’ve been logged out.'); }}>Log out</button></div>
          </>
        ) : (
          <form onSubmit={save} noValidate>
            <label>Full name<input value={f.name} onChange={on('name')} /></label>
            <label>Phone<input value={f.phone} onChange={on('phone')} /></label>
            <label>New password (leave blank to keep current)<input type="password" value={f.password} onChange={on('password')} autoComplete="new-password" /></label>
            {err && <div className="alert err" role="alert">{err}</div>}
            <div className="row"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
