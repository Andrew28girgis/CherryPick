import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
import {
  IBuyBoxContact,
  IBuyboxOrganization,
  IUserBuybox,
} from '../../models/sidenavbar';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992;
  isSidebarExpanded: boolean = true; // Default collapsed state
  isHovering: boolean = false;
  kanbanId$!: Observable<number>;
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

  userBuyboxes: IUserBuybox[] = [];
  buyboxOrganizations: IBuyboxOrganization[] = [];
  BuyBoxContacts: IBuyBoxContact[] = [];

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    protected cdr: ChangeDetectorRef
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isSidebarExpanded = !state;
      this.sidbarService.setSidebarState(this.isSidebarExpanded);
    });
  }

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992;
    this.isSidebarExpanded = true;
    this.sidbarService.setSidebarState(this.isSidebarExpanded);
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
    this.viewSubscription = this.userViewService.currentView$.subscribe(
      (view) => {
        this.currentView = view;
      }
    );
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
    if (!this.isSidebarExpanded) {
      this.isHovering = isHovering;
      this.hoverStateChange.emit(isHovering);
    }
  }
}
