import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { useUI } from '../context/UI';

export default function Login({ mode = 'login' }) {
  const reg = mode === 'register';
  const { login, register } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (reg && !f.name.trim()) return setErr('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.');
    if (f.password.length < (reg ? 6 : 1)) return setErr(reg ? 'Password must be at least 6 characters.' : 'Please enter your password.');
    setBusy(true);
    try {
      const u = reg ? await register(f) : await login(f.email, f.password);
      toast(reg ? 'Welcome to IMovies!' : `Welcome back, ${u.name.split(' ')[0]}!`);
      nav(u.role === 'admin' && from === '/' ? '/admin' : from, { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>{reg ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{reg ? 'Book tickets in a few taps.' : 'Log in to book tickets and see your bookings.'}</p>
        {reg && <label>Full name<input value={f.name} onChange={on('name')} autoComplete="name" /></label>}
        <label>Email<input type="email" value={f.email} onChange={on('email')} autoComplete="email" /></label>
        {reg && <label>Phone (optional)<input value={f.phone} onChange={on('phone')} autoComplete="tel" /></label>}
        <label>Password<input type="password" value={f.password} onChange={on('password')} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
        {err && <div className="alert err" role="alert">{err}</div>}
        <button className="btn primary block lg" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        <p className="muted center">
          {reg ? <>Already have an account? <Link to="/login" state={{ from }}>Log in</Link></> : <>New here? <Link to="/register" state={{ from }}>Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}
