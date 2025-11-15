const API_BASE = (process.env.REACT_NATIVE_APP_API_URL as string) || 'http://localhost:3000';

export async function login(email: string, password: string) {
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
