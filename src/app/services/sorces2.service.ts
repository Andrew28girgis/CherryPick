import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface WebsiteMetadata {
  title: string;
  description: string;
  favicon: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Sources2Service {
  constructor(private http: HttpClient) {}

  getHostnameFromURL(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  getWebsiteMetadata(url: string): Observable<WebsiteMetadata> {
    // Ensure the URL includes a protocol.
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = this.getHostnameFromURL(fullUrl);

    // *** IMPORTANT ***
    // If you are running into CORS issues, you can prepend a CORS proxy URL here.
    // For example, using cors-anywhere (note: cors-anywhere requires you to request temporary access):
    // const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    // Then use proxyUrl + fullUrl in the request below.
    const proxyUrl = 'https://corsproxy.io/?url=';
    return this.http.get(proxyUrl + fullUrl, { responseType: 'text' }).pipe(
      map((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Get the title or use the hostname if not found.
        const title = doc.querySelector('title')?.textContent?.trim() || hostname;
        
        // Try to get the description from either the standard meta tag or Open Graph meta tag.
        const descriptionMeta =
          doc.querySelector('meta[name="description"]') ||
          doc.querySelector('meta[property="og:description"]');
        const description =
          descriptionMeta?.getAttribute('content')?.trim() ||
          `Website link for ${hostname}`;

        // Get favicon: try <link rel="icon">, then <link rel="shortcut icon">, else fallback.
        let favicon =
          doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
          doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
          `https://icon.horse/icon/${hostname}`;
        if (favicon && !favicon.startsWith('http')) {
          // Resolve relative URLs.
          favicon = new URL(favicon, fullUrl).href;
        }

        return {
          title,
          description,
          favicon,
          success: true,
        };
      }),
      catchError((error) => {
        console.error('Error fetching website metadata:', error);
        return of({
          title: hostname,
          description: `Website link for ${hostname}`,
          favicon: `https://icon.horse/icon/${hostname}`,
          success: false,
        });
      })
    );
  }
}
