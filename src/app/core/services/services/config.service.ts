import { Injectable } from '@angular/core';
import { getDomainConfig } from '../../../config';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private domainConfig: any;

  constructor() {
    const domain = window.location.href;
    const port = window.location.port;
    this.domainConfig = getDomainConfig(domain);
  }

  getLogoUrl(): string {
    return this.domainConfig ? this.domainConfig.logo : '';
  }

  getColor(): string {
    return this.domainConfig ? this.domainConfig.color : '';
  }

  getFontFamily(): string {
    return this.domainConfig ? this.domainConfig.fontFamily : '';
  }
}
