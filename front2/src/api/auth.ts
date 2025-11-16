import config from '../config';

export async function login(email: string, password: string) {
  // Use API root (which already includes /api) to avoid double /api in URLs
  const API_ROOT = config.getApiRoot();
  const url = `${API_ROOT}/auth/login`;

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
