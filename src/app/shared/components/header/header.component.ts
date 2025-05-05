import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Router,
  NavigationEnd,
  Event as RouterEvent,
  ActivatedRoute,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { UserViewService } from 'src/app/core/services/user-view.service';

export type UserView = 'campaigns' | 'landlord';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  // UI State
  readonly MOBILE_BREAKPOINT = 992;
  isSmallScreen = window.innerWidth < this.MOBILE_BREAKPOINT;
  isNavbarOpen = false;
  displayHeader = true;

  // User State
  userAvatar: string | null = null;
  currentView: UserView = 'campaigns';
  currentRoute = '';
  contactId: any;
  showRecord: boolean = false;
  showlink: boolean = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public router: Router,
    private userViewService: UserViewService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeScreenSize();
    this.setupRouteSubscriptions();
    this.setupUserViewSubscription();
    this.fetchUserAvatar();
    // Update showlink on every navigation event in case login state changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showlink = Number(localStorage.getItem('contactId')) === 15562;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub?.unsubscribe());
  }

  /**
   * Toggles the navigation menu in mobile view
   */
  toggleNavbar(event: Event): void {
    event.stopPropagation();
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  /**
   * Switches between campaign and landlord views
   */
  switchView(): void {
    const newView: UserView =  this.currentView === 'campaigns' ? 'landlord' : 'campaigns';
    this.userViewService.switchView(newView);
    this.router.navigate([newView]);
  }

  /**
   * Handles user logout by clearing storage and redirecting to login
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userView');
    this.router.navigate(['/login']);
  }

  // Private Methods
  private initializeScreenSize(): void {
    this.isSmallScreen = window.innerWidth < this.MOBILE_BREAKPOINT;
    this.currentRoute = this.router.url;
  }

  private setupRouteSubscriptions(): void {
    // Subscribe to route data to handle header visibility
    const routeDataSub = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.displayHeader = !data['hideHeader'];
      });

    // Subscribe to navigation events to update current route
    const navigationSub = this.router.events
      .pipe(
        filter(
          (event: RouterEvent): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        this.isNavbarOpen = false; // Close navbar on route change
      });

    this.subscriptions.push(routeDataSub, navigationSub);
  }

  private setupUserViewSubscription(): void {
    const viewSub = this.userViewService.currentView$.subscribe((view) => {
      this.currentView = view;
    });
    this.subscriptions.push(viewSub);
  }

  private fetchUserAvatar(): void {
    // TODO: Implement user avatar fetching logic
    this.userAvatar = '';
  }
}
