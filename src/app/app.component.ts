import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  NavigationEnd,
  NavigationStart,
  ActivatedRoute,
} from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

interface CopilotState {
  type?: string;
  isOpen: boolean;
  isFullyOpen: boolean;
  overlayActive?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  isMarketSurveyRoute = false;
  isChatbotRoute = false;
  isEmilyChatBot = false;
  hideSidebar = false;
  showingTransition = false;
  overlayActive = false;
  isCopilotOpen = false;
  isCopilotFullyOpen = false;
  campaignId: any;
  private destroy$ = new Subject<void>();
  isMobile!: boolean;
  sidebarCollapsed = false;
  shouldShowSidebar = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private placeService: PlacesService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
  }
  ngOnInit(): void {
    this.initializeApiMode();
    this.setupRouteSubscriptions();
    this.setupNotificationSubscriptions();
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

 

  get shouldShowNotifications(): boolean {
    return (
      this.isAuthenticated &&
      !this.hideSidebar &&
      !this.showingTransition &&
      !this.isEmilyChatBot
    );
  }

  get appShellClasses(): { [key: string]: boolean } {
    return {
      'with-sidebar': this.shouldShowSidebar,
      'with-copilot': this.isCopilotOpen,
      'copilot-expanded': this.isCopilotFullyOpen,
      'emily-chatbot': this.isEmilyChatBot,
      'chatbot-route': this.isChatbotRoute,
      authenticated: this.isAuthenticated,
      'overlay-active': this.overlayActive,
    };
  }

  onOverlayStateChange(overlayActive: boolean): void {
    this.overlayActive = overlayActive;
  }

  onCopilotStateChange(event: CopilotState): void {
    if (event?.type === 'overlay') {
      this.overlayActive = !!event.overlayActive;
      return;
    }

    this.isCopilotOpen = event.isOpen;
    this.isCopilotFullyOpen = event.isFullyOpen;
  }

  private initializeApiMode(): void {
    const apiMode = localStorage.getItem('apiMode');
    if (apiMode && JSON.parse(apiMode)) {
      this.placeService.setAppMode('api');
    }
  }

  private setupRouteSubscriptions(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.handleNavigationEnd(event);
        this.updateRouteData();
      });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart => event instanceof NavigationStart
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationStart) => {
        this.handleNavigationStart(event);
      });
  }

  private setupNotificationSubscriptions(): void {
    this.notificationService.chatOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen: boolean) => {
        this.isCopilotFullyOpen = isOpen;
        this.isCopilotOpen = isOpen;
      });
  }

  private handleNavigationEnd(event: NavigationEnd): void {
    const url = event.urlAfterRedirects || event.url;
    const onEmilyChatRoute =
      url === '/emily-chatsbot' || url.startsWith('/emily-chatsbot/');
    this.isChatbotRoute = onEmilyChatRoute;
    this.isEmilyChatBot = this.router.url.includes('chatbot');
    this.setCampaignIdFromRoute();
  }

  private handleNavigationStart(event: NavigationStart): void {
    const isTransitionRoute =
      event.url === '/campaigns' || event.url === '/summary';
    const fromLoginRoute = this.router.url === '/login';

    if (isTransitionRoute && fromLoginRoute) {
      this.showingTransition = true;
      setTimeout(() => {
        this.showingTransition = false;
      }, 0);
    }
  }

  private updateRouteData(): void {
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    currentRoute.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.hideSidebar = data['hideSidebar'] === true;
      this.isMarketSurveyRoute = data['isMarketSurveyRoute'] === true;
    });
  }

  private setCampaignIdFromRoute(): void {
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    this.campaignId = currentRoute;
  }

  onSidebarCollapseChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}
