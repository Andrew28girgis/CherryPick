import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  HostListener,
  ElementRef,
} from '@angular/core';
import {
  Router,
  NavigationEnd,
  Event as RouterEvent,
  ActivatedRoute,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
import { Location } from '@angular/common';
import { NavigationService } from 'src/app/core/services/navigation-service.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992; // Initialize screen size detection

  @HostListener('window:resize', [])
  onResize() {
    this.isSmallScreen = window.innerWidth < 992;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.isNavbarOpen &&
      this.elementRef.nativeElement.querySelector('#navbarNav') &&
      !this.elementRef.nativeElement
        .querySelector('#navbarNav')
        .contains(event.target as Node) &&
      !this.elementRef.nativeElement
        .querySelector('.navbar-toggler')
        ?.contains(event.target as Node)
    ) {
      this.isNavbarOpen = false;
    }
  }

  isCollapsed = false;
  userAvatar: string | null = null;
  currentView: 'tenant' | 'landlord' = 'tenant';
  current = '';
  private viewSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private sidebarSubscription: Subscription | null = null;
  @ViewChild('emailContent') emailContent!: TemplateRef<any>;
  @ViewChild('notificationContent') notificationContent!: TemplateRef<any>;
  previousUrl: string | null = null; // New property for tracking previous URL

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    private elementRef: ElementRef,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute
  ) {}

  display: boolean = true;

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992;

    this.current = this.router.url;

    this.router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        // Traverse the activated route to the deepest child
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
    )
    .subscribe((data:any) => {
   
      
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

    this.sidebarSubscription = this.sidbarService.isCollapsed.subscribe(
      (state: boolean) => {
        this.isCollapsed = state;
      }
    );
    this.fetchUserAvatar();
  }

  ngOnDestroy(): void {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
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
    const newView = this.currentView === 'tenant' ? 'landlord' : 'tenant';
    this.userViewService.switchView(newView);
  }

  isNavbarOpen = false;
  toggleNavbar(event: Event) {
    event.stopPropagation();
    this.isNavbarOpen = !this.isNavbarOpen;
  }
  goBack() {
    const prevUrl = this.navigationService.getPreviousUrl();
    if (prevUrl) {
      this.router.navigateByUrl(prevUrl);
    } else {
      this.router.navigate(['/campaigns']);
    }
  }
}
