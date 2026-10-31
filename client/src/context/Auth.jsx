import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { resetSocket } from '../lib/socket';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('imovies_token'));

  useEffect(() => {
    if (!localStorage.getItem('imovies_token')) return;
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('imovies_token')).finally(() => setLoading(false));
  }, []);

  const accept = useCallback(({ token, user }) => { localStorage.setItem('imovies_token', token); resetSocket(); setUser(user); return user; }, []);
  const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(accept);
  const register = (body) => api('/auth/register', { method: 'POST', body }).then(accept);
  const logout = () => { localStorage.removeItem('imovies_token'); resetSocket(); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
