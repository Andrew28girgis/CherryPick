// navigation.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly HISTORY_KEY = 'app_navigation_history';

  constructor(private router: Router) {
    // Track navigation events - fix the type issue
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.storeUrl(event.urlAfterRedirects);
    });
  }

  private storeUrl(url: string): void {
    // Skip login/auth pages if needed
    if (url.includes('login')) {
      return;
    }

    try {
      // Get existing history
      const history = this.getHistory();
      
      // Don't add duplicate consecutive entries
      if (history.length > 0 && history[history.length - 1] === url) {
        return;
      }
      
      // Add current URL to history
      history.push(url);
      
      // Keep only the last 20 URLs to avoid excessive storage
      if (history.length > 20) {
        history.shift();
      }
      
      // Save back to localStorage
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Error storing navigation history', e);
    }
  }

  private getHistory(): string[] {
    try {
      const history = localStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('Error retrieving navigation history', e);
      return [];
    }
  }

  public getPreviousUrl(): string | null {
    const history = this.getHistory();
    const currentUrl = this.router.url;
    
    // Find current URL in history
    const currentIndex = history.indexOf(currentUrl);
    
    if (currentIndex > 0) {
      // If found, return the previous URL
      return history[currentIndex - 1];
    } else if (currentIndex === -1 && history.length > 0) {
      // If current URL not in history (new tab case), return the last URL
      return history[history.length - 1];
    }
    
    return null;
  }

  public clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
}