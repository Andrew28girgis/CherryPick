import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WebsiteMetadata {
  title: string;
  description: string;
  favicon: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SourcesService {
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
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = this.getHostnameFromURL(fullUrl);

    // Using cors-anywhere as an alternative proxy
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${fullUrl}`;
    
    return this.http.get(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).pipe(
      map((response: any) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, 'text/html');
        
        // Get favicon with fallback
        const faviconLink = doc.querySelector('link[rel*="icon"]')?.getAttribute('href') || '/favicon.ico';
        const favicon = new URL(faviconLink, fullUrl).href;
        
        // Get metadata with fallbacks
        const title = doc.querySelector('title')?.textContent || hostname;
        const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
          `Website link for ${hostname}`;
        
        return {
          title,
          description: metaDescription,
          favicon,
          success: true
        };
      }),
      catchError(() => of({
        title: hostname,
        description: `Website link for ${hostname}`,
        favicon: `https://icon.horse/icon/${hostname}`,
        success: false
      }))
    );
  }
}