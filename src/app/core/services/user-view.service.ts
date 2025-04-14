import { Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { Router, NavigationEnd, type Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserViewService {
  private currentViewSubject = new BehaviorSubject<'campaigns' | 'landlord'>(
    'campaigns'
  );
  public currentView$: Observable<'campaigns' | 'landlord'> =
    this.currentViewSubject.asObservable();

  constructor(private router: Router) {
    // Initialize view based on current URL or localStorage
    const savedView = localStorage.getItem('userView') as
      | 'campaigns'
      | 'landlord'
      | null;

    if (savedView) {
      this.currentViewSubject.next(savedView);
    } else {
      // Default to tenant view if no saved preference
      this.updateViewFromUrl(window.location.pathname);
    }

    // Listen for route changes
    this.router.events
      .pipe(
        filter(
          (event: Event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        // Only update view from URL if it's a landlord route
        // This prevents tenant routes from changing the view
        if (event.url.includes('/campaigns')) {
          this.updateViewFromUrl(event.url);
        }
      });
  }

  private updateViewFromUrl(url: string): void {
    const isLandlordRoute = url.includes('/landlord');
    const newView = isLandlordRoute ? 'landlord' : 'campaigns';

    // Update localStorage
    localStorage.setItem('userView', newView);

    // Update BehaviorSubject
    this.currentViewSubject.next(newView);
  }

  public switchView(view: 'campaigns' | 'landlord'): void {
    localStorage.setItem('userView', view);
    this.currentViewSubject.next(view);

    if (view === 'landlord') {
      this.router.navigate(['/landlord']);
    } else {
      this.router.navigate(['/campaigns']);
    }
  }

  public getCurrentView(): 'campaigns' | 'landlord' {
    return this.currentViewSubject.value;
  }
}
