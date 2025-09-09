import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  hideSidebar = false;

  // Chatbot / copilot UI state
  isChatbotRoute = false;
  isEmilyChatBot = false; // kept for template compatibility
  isCopilotOpen = false;
  isCopilotFullyOpen = false;
  overlayActive = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private placeService: PlacesService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // App mode from localStorage
    try {
      const apiMode = localStorage.getItem('apiMode');
      if (apiMode && JSON.parse(apiMode)) {
        this.placeService.setAppMode('api');
      }
    } catch {
      // ignore malformed localStorage values
    }

    // Single router subscription to drive all route-based UI state
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;

        // Special layout only for Emily chatbot route(s)
        // (accept both 'emily-chatsbot' and 'emily-chatbot' just in case)
        this.isChatbotRoute =
          url === '/emily-chatsbot' ||
          url.startsWith('/emily-chatsbot/') ||
          url === '/emily-chatbot' ||
          url.startsWith('/emily-chatbot/');

        // Preserve previous behavior for any template checks
        this.isEmilyChatBot = url.includes('chatbot');

        // Read deepest child route's data for per-page flags
        const deepest = this.getDeepestRoute(this.activatedRoute);
        this.hideSidebar = deepest.snapshot.data?.['hideSidebar'] === true;
      });

    // Copilot open/close state
    this.notificationService.chatOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen) => {
        this.isCopilotOpen = isOpen;
        this.isCopilotFullyOpen = isOpen;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

  onCopilotStateChange(evt: any): void {
    if (evt?.type === 'overlay') {
      this.overlayActive = !!evt.overlayActive;
      return;
    }
    this.isCopilotOpen = !!evt?.isOpen;
    this.isCopilotFullyOpen = !!evt?.isFullyOpen;
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) route = route.firstChild;
    return route;
  }
}
