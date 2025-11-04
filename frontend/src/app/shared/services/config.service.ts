import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: any;

  loadConfig(): Promise<void> {
    return fetch('assets/config.json')
      .then(response => response.json())
      .then(config => {
        this.config = config;
        console.log('[ConfigService] apiUrl chargé :', this.config?.apiUrl);
      });
  }

  get apiUrl(): string {
    return this.config?.apiUrl || '';
  }
}
