import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ROOT } from '../config';

async function authHeader() {
  try {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (err) {
    return {};
  }
}

async function request(path: string, opts: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  const auth = await authHeader();
  const res = await fetch(`${API_ROOT}${path}`, { ...opts, headers: { ...headers, ...auth } });
  if (res.status === 204) return null;
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(json?.message || res.statusText || 'Request failed');
    return json;
  } catch (err) {
    // If JSON.parse fails, throw generic error
    if (!res.ok) throw new Error(res.statusText || 'Request failed');
    return null;
  }
}

export const api = {
  get: (p: string) => request(p, { method: 'GET' }),
  post: (p: string, body?: any) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p: string, body?: any) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p: string) => request(p, { method: 'DELETE' }),
};

export default api;
