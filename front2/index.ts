import { registerRootComponent } from 'expo';

import App from './App';
import config from './src/config';

async function bootstrap() {
	try {
		if (typeof window !== 'undefined') {
			await config.initConfig();
		}
	} catch (e) {
		// ignore
	}
	registerRootComponent(App);
}

bootstrap();
