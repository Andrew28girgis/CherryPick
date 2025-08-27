import { Component, HostListener, OnInit } from '@angular/core';
import {
  Router,
  NavigationEnd,
  NavigationStart,
  ActivatedRoute,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnInit {
  isMarketSurveyRoute = false;
  isMobile = false;
  isSocialView: boolean = false;
  hideSidebar = false;
  isNotificationsOpen = false; // Add this property to your class
  showingTransition = false;
  isCopilotOpen = false;
  isCopilotFullyOpen = false;
  isEmilyChatBot: boolean = false; // Initialize with a default value
  overlayActive = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private placeService: PlacesService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const apiMode = this.localStorage.getItem('apiMode');
    if (apiMode && JSON.parse(apiMode)) {
      this.placeService.setAppMode('api');
    }
    this.checkScreenSize();
    this.isSocialView =
      this.localStorage.getItem('currentViewDashBord') === '5';

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.activatedRoute;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        currentRoute.data.subscribe((data) => {
          this.hideSidebar = data['hideSidebar'] === true;
        });

        this.isEmilyChatBot = this.router.url.includes('chatbot');
      });

    // Listen for route changes to handle transitions
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event: any) => {
        if (
          (event.url === '/campaigns' || event.url === '/summary') &&
          this.router.url === '/login'
        ) {
          // Add a brief transition state when going from login to dashboard
          this.showingTransition = true;
          this.showingTransition = false;
        }
      });

    // Subscribe to notification service to know if Emily sidebar is open or closed
    this.notificationService.chatOpen$.subscribe((isOpen) => {
      this.isCopilotFullyOpen = isOpen;
      // Only mark it as open for margin purposes if the sidebar is fully expanded
      this.isCopilotOpen = isOpen;
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

  get localStorage() {
    return localStorage;
  }

  @HostListener('window:resize', ['$event'])

  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
  }

  onCopilotStateChange(evt: any) {
    if (evt?.type === 'overlay') {
      this.overlayActive = !!evt.overlayActive;
      return;
    }
    this.isCopilotOpen = evt.isOpen;
    this.isCopilotFullyOpen = evt.isFullyOpen;
  }
}