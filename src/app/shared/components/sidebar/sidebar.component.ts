import {
  Component,
  Input,
  ViewChild,
  OnInit,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { filter } from 'rxjs/operators';
type UserView = 'campaigns' | 'landlord';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  isChatbotRoute!: boolean;
  constructor(
    public notificationService: NotificationService,
    private placesService: PlacesService,
    public router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) {}
  currentView: UserView = 'campaigns';
  showSidebar = true;

  @ViewChild('addAIKeyTypes') addAIKeyTypes!: any;
  AIKey: string = '';
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  errorMessage: string | null = null;
  isNotificationsOpen = false;
  currentRoute = '';
  isDropdownOpen = false;
  isMenuOpen = false;

  ngOnInit(): void {
    // Initialize with chat open
    this.isNotificationsOpen = true;

    // Subscribe to notification service to sync state
    this.notificationService.chatOpen$.subscribe((isOpen) => {
      this.isNotificationsOpen = isOpen;
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.route;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        currentRoute.data.subscribe((data) => {
          this.showSidebar = !data['hideSidebar'];
        });
      });
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(url);
      });
  }

  toggleEmilySidebar(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.notificationService.setChatOpen(this.isNotificationsOpen);

    // If the notification panel is now open, reset the counter
    if (this.isNotificationsOpen) {
      this.notificationService.newNotificationsCount = 0;
    }
  }

  openAddAIKey(): void {
    this.resetModalState();
    this.GetUserAPIAIKey();
    if (this.addAIKeyTypes) {
      this.modalService.open(this.addAIKeyTypes, {
        size: 'md',
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'fancy-modal-window',
        backdropClass: 'fancy-modal-backdrop',
      });
    }
  }

  SetGPTAPIKey(): void {
    if (!this.AIKey) {
      this.errorMessage = 'Please enter an ChatGPT Key';
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
        this.showToast('ChatGPT Key Has Been Added Successfully');
        this.modalService.dismissAll();
      },
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
    }
  }
  GetUserAPIAIKey() {
    const body = {
      Name: 'GetUserAPIAIKey',
      Params: {},
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.AIKey = res?.json[0]?.openAIKey || '';
      },
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userView');
    this.router.navigate(['/login']);
  }

  // switchView(): void {
  //   const newView: UserView =
  //     this.currentView === 'campaigns' ? 'landlord' : 'campaigns';
  //   this.userViewService.switchView(newView);
  //   this.router.navigate([newView]);
  // }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Close dropdown if clicked outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    
    // Check dropdown independently
    if (!target.closest('.dropdown')) {
      this.isDropdownOpen = false;
    }

    // Check nav-group independently (but exclude the menu toggle button)
    if (!target.closest('.nav-group') && !target.closest('.menu-toggle')) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
