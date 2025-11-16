import config from '../config';

export async function login(email: string, password: string) {
  // Use API root (which already includes /api) to avoid double /api in URLs
  const API_ROOT = config.getApiRoot();
  const url = `${API_ROOT}/auth/login`;
  // Trace the final URL used for login requests (helps diagnose wrong host/path)
  // This will appear in the browser console when running the web app
  try {
    // eslint-disable-next-line no-console
    console.log('[front2] Login URL:', url);
  } catch (e) {
    /* ignore in restricted environments */
  }
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
