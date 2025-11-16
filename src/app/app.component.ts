import { Component, OnInit } from '@angular/core';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isMarketSurveyRoute = false;
  isChatbotRoute = false;
  isEmilyChatBot = false;
  notificationView=false;
  hideSidebar = false;
  showingTransition = false;
  overlayActive = false;
  campaignId: any;
  shouldShowSidebar = true;
  private destroy$ = new Subject<void>();

  constructor(
    private placeService: PlacesService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeApiMode();
    this.setupRouteSubscriptions();
  }

  private initializeApiMode(): void {
    const apiMode = localStorage.getItem('apiMode');
    if (apiMode && JSON.parse(apiMode)) {
      this.placeService.setAppMode('api');
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

  get appShellClasses(): { [key: string]: boolean } {
    return {
      'with-sidebar': this.shouldShowSidebar,
      'emily-chatbot': this.isEmilyChatBot,
      'chatbot-route': this.isChatbotRoute,
      authenticated: this.isAuthenticated,
      'overlay-active': this.overlayActive,
    };
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

  private handleNavigationEnd(event: NavigationEnd): void {
    const url = event.urlAfterRedirects || event.url;
    const onEmilyChatRoute =
      url === '/emily-chatsbot' || url.startsWith('/emily-chatsbot/');
    this.isChatbotRoute = onEmilyChatRoute;
    this.isEmilyChatBot = this.router.url.includes('chatbot');
    this.notificationView = this.router.url.includes('notification-view');
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
}
