let API_URL = process.env.API_URL || 'http://localhost:3000';
let API_ROOT = `${API_URL}/api`;

export async function initConfig() {
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
		// keep defaults
	}
}

export function getApiUrl() {
	return API_URL;
}

export function getApiRoot() {
	return API_ROOT;
}

export default { initConfig, getApiUrl, getApiRoot };
