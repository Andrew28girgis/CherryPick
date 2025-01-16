import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface WebsiteMetadata {
  title: string;
  description: string;
  favicon: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Sources2Service {
  getHostnameFromURL(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  getWebsiteMetadata(url: string): Observable<WebsiteMetadata> {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = this.getHostnameFromURL(fullUrl);

    const metadata: WebsiteMetadata = {
      title: hostname,
      description: `Website link for ${hostname}`,
      favicon: `https://icon.horse/icon/${hostname}`,
      success: true
    };

    return of(metadata);
  }
}

