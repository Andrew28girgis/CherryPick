import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992;
  isSidebarExpanded: boolean = false; // Default collapsed state
  isHovering: boolean = false;
  
  // Add output event to notify parent of hover state changes
  @Output() hoverStateChange = new EventEmitter<boolean>();

  @HostListener('window:resize', [])
  onResize() {
    this.isSmallScreen = window.innerWidth < 992;
  }

  // New variable that will hold the current route URL.
  current: string = '';
  currentView: 'tenant' | 'landlord' = 'tenant';

  private viewSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isSidebarExpanded = !state;
      // Notify the service about sidebar state changes
      this.sidbarService.setSidebarState(this.isSidebarExpanded);
    });
  }

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992; 
    this.isSidebarExpanded = false; // Default collapsed state
    
    // Notify the service about initial sidebar state
    this.sidbarService.setSidebarState(this.isSidebarExpanded);

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
  }

  ngOnDestroy(): void {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleSidebar(event: Event) {
    event.stopPropagation();
    this.isSidebarExpanded = !this.isSidebarExpanded;
    this.sidbarService.toggleSidebar();
  }

  onSidebarHover(isHovering: boolean) {
    // Only apply hover effect if sidebar is collapsed
    if (!this.isSidebarExpanded) {
      this.isHovering = isHovering;
      // Emit the hover state change to parent
      this.hoverStateChange.emit(isHovering);
    }
  }
}