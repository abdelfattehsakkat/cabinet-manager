import config from '../config';

export async function login(email: string, password: string) {
  const API_BASE = config.getApiUrl();
  const url = `${API_BASE}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password })
  });

  let payload: any;
  try {
    payload = await res.json();
  } catch (e) {
    const txt = await res.text();
    throw new Error(txt || 'Invalid JSON response from server');
  }

  if (!res.ok) {
    const message = payload?.message || payload?.error || JSON.stringify(payload) || 'Login failed';
    throw new Error(message);
  }

  return payload;
}
