let API_URL = process.env.API_URL || 'http://localhost:3000';
let API_ROOT = `${API_URL}/api`;

export async function initConfig() {
	// Try to load runtime config from /assets/config.json (served by nginx)
	try {
		if (typeof window !== 'undefined' && typeof (window as any).fetch === 'function') {
			const res = await fetch('/assets/config.json', { cache: 'no-store' });
			if (res.ok) {
				const cfg = await res.json();
				if (cfg?.apiUrl) {
					API_URL = cfg.apiUrl;
					API_ROOT = `${API_URL}/api`;
				}
			}
		}
	} catch (err) {
		// ignore and fallback to env/default
		// console.warn('Could not load runtime config, using defaults', err);
	}
}

export function getApiUrl() {
	return API_URL;
}

export function getApiRoot() {
	return API_ROOT;
}

export default { initConfig, getApiUrl, getApiRoot };
