import { Component, OnInit } from '@angular/core';
import {
  Router,
  NavigationEnd,
  Event as RouterEvent,
  ActivatedRoute,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators'; 
import { UserViewService } from 'src/app/core/services/user-view.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  isSmallScreen: boolean = window.innerWidth < 992;
  isCollapsed = false;
  userAvatar: string | null = null;
  currentView: 'campaigns' | 'landlord' = 'campaigns';
  current = '';
  private viewSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private sidebarSubscription: Subscription | null = null;
  isNavbarOpen = false;
  display: boolean = true;

  constructor( 
    public router: Router,
    private userViewService: UserViewService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992;
    this.current = this.router.url;
    this.router.events
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
      .subscribe((data: any) => {
        // If the current route has data { hideHeader: true }, then do not display the header.
        this.display = !data.hideHeader;
      });

    // Subscribe to router events to update the `current` variable whenever the route changes.
    this.routerSubscription = this.router.events
      .pipe(
        filter(
          (event: RouterEvent): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.current = event.urlAfterRedirects;
        // Close navbar when route changes
        this.isNavbarOpen = false;
      });

    this.current = this.router.url;

    this.viewSubscription = this.userViewService.currentView$.subscribe(
      (view) => {
        this.currentView = view;
      }
    );

   
    this.fetchUserAvatar();
  }
  
  fetchUserAvatar(): void {
    this.userAvatar = '';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userView');
    this.router.navigate(['/login']);
  }

  switchView(): void {
    const newView = this.currentView === 'campaigns' ? 'landlord' : 'campaigns';
    this.userViewService.switchView(newView);
    this.router.navigate([newView]);
  }

  toggleNavbar(event: Event) {
    event.stopPropagation();
    this.isNavbarOpen = !this.isNavbarOpen;
  }
}
