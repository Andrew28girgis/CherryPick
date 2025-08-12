import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  Router,
  NavigationEnd,
  Event as RouterEvent,
  ActivatedRoute,
} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { PlacesService } from 'src/app/core/services/places.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
export type UserView = 'campaigns' | 'landlord';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly MOBILE_BREAKPOINT = 992;
  isSmallScreen = window.innerWidth < this.MOBILE_BREAKPOINT;
  isNavbarOpen = false;
  displayHeader = true;
  userAvatar: string | null = null;
  currentView: UserView = 'campaigns';
  currentRoute = '';
  contactId: any;
  showRecord: boolean = false;
  showlink: boolean = false;
  private subscriptions: Subscription[] = [];
  @ViewChild('addAIKeyTypes') addAIKeyTypes!: any;
  AIKey: string = '';
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  errorMessage: string | null = null;
  constructor(
    public router: Router,
    private userViewService: UserViewService,
    private activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeScreenSize();
    this.setupRouteSubscriptions();
    this.setupUserViewSubscription();
    this.fetchUserAvatar();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showlink = Number(localStorage.getItem('contactId')) === 15562;
      });
  }

  getMode(): string {
    return this.placesService.getAppMode();
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
    const newView: UserView =
      this.currentView === 'campaigns' ? 'landlord' : 'campaigns';
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
    this.userAvatar = '';
  }
  openAddAIKey(): void {
    this.resetModalState();
    if (this.addAIKeyTypes) {
      this.modalService.open(this.addAIKeyTypes, {
        size: 'md',
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'fancy-modal-window',
        backdropClass: 'fancy-modal-backdrop'
      });
    }
  }

  SetGPTAPIKey(): void {
    if (!this.AIKey) {
      this.errorMessage = 'Please enter an AI Key';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    
    const body = {
      Name: 'SetGPTAPIKey',
      Params: { OpenAIKey: this.AIKey },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.saveSuccess = true;
        this.showToast(
            'AI Key Has Been Added Successfully'
          );
        this.modalService.dismissAll();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Failed to save AI Key';
      }
    });
  }

  private resetModalState(): void {
    this.isSaving = false;
    this.saveSuccess = false;
    this.errorMessage = null;
    this.AIKey = '';
  }
    showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    } else {
      console.warn('Toast elements not found in DOM.');
    }
  }

}
