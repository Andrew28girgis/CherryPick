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
import { PlacesService } from 'src/app/core/services/places.service';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
import { IUserKanban } from '../../models/iuser-kanban';
import { cadenceSidebar } from '../../models/sidenavbar';
import { IKanbanDetails } from '../../models/ikanban-details';
import { CadenceService } from 'src/app/core/services/cadence.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992;
  isSidebarExpanded: boolean = false; // Default collapsed state
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

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    private PlacesService: PlacesService,
    protected cadenceService: CadenceService,
    protected cdr: ChangeDetectorRef
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isSidebarExpanded = !state;
      // Notify the service about sidebar state changes
      this.sidbarService.setSidebarState(this.isSidebarExpanded);
    });
  }

  ngOnInit(): void {
    this.getUserKanbans();
    this.isSmallScreen = window.innerWidth < 992;
    this.isSidebarExpanded = false;
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
    this.kanbanId$ = this.cadenceService.getKanbanId();
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

  // Cadence
  protected allUserKanbans: IUserKanban[] = [];
  sideKanban: cadenceSidebar = { tenantOrganizations: [] }; // Initialize with a default value
  cadenceIsOpen = false;

  private getUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.allUserKanbans = data.json;
        this.cadenceService.updateKanbanId(
          this.allUserKanbans[0].kanbanDefinitions[0].kanbanId
        );

        this.getKanbanDetails(
          this.allUserKanbans[0].kanbanDefinitions[0].kanbanId
        );
      },
    });
  }

  private getKanbanDetails(kanbanId: number): void {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: kanbanId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        let details: IKanbanDetails = data.json[0];
        details.kanbanStages.forEach((stage) => {
          if (stage.StageOrganizations) {
            stage.StageOrganizations.forEach((org) => {
              this.sideKanban.tenantOrganizations.push({
                ...org,
                isOpen: false,
              });
            });
          }
        });
      },
    });
  }
}
