import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  HostListener,
  ElementRef,
} from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';

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

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992;

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
}
