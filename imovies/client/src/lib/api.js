const BASE = (import.meta.env.VITE_SERVER_URL || '') + '/api';
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('imovies_token');
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || 'Something went wrong.'); e.status = res.status; throw e; }
  return data;
}
