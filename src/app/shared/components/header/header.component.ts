import { Component, OnInit, OnDestroy, ViewChild, TemplateRef,HostListener } from '@angular/core';
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
  isCollapsed = true;
  notifications: any[] = [
    { id: 1, message: 'New notification 1', time: '5 min ago' },
    { id: 2, message: 'New notification 2', time: '1 hour ago' },
    { id: 3, message: 'New notification 3', time: '2 hours ago' },
  ];

  emails: any[] = [
    { id: 1, subject: 'Upcoming meeting', from: 'john@example.com', time: '10:00 AM' },
    { id: 2, subject: 'Project update', from: 'sarah@example.com', time: '11:30 AM' },
    { id: 3, subject: 'Weekly report', from: 'mike@example.com', time: '2:00 PM' },
  ];

  // Avatar and view switching properties
  userAvatar: string | null = null;
  currentView: 'tenant' | 'landlord' = 'tenant';
  // New variable that will hold the current route URL.
  current: string = '';

  private viewSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  @ViewChild('emailContent') emailContent!: TemplateRef<any>;
  @ViewChild('notificationContent') notificationContent!: TemplateRef<any>;

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state;
    });
  }

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
      });

    // Initialize `current` with the current URL.
    this.current = this.router.url;

    // Subscribe to view changes if needed.
    this.viewSubscription = this.userViewService.currentView$.subscribe((view) => {
      this.currentView = view;
    });

    // Fetch user avatar.
    this.fetchUserAvatar();
  }

  ngOnDestroy(): void {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  fetchUserAvatar(): void {
    // Placeholder for API call to get user avatar.
    setTimeout(() => {
      this.userAvatar = '';
    }, 500);
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar();
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

  BackTo() {
    this.router.navigate(['/dashboard']);
  }

  isNavbarOpen = false;

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen;
  }
}
