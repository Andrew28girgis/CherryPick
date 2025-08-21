import { Component, Input, ViewChild, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
import { UserView } from '../header/header.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  constructor(
    public notificationService: NotificationService,
    private placesService: PlacesService,
    public router: Router,
    private modalService: NgbModal,
    private userViewService: UserViewService,
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

  ngOnInit(): void {
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
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Failed to save ChatGPT Key';
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
      console.warn('Toast elements not found in DOM.');
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
      error: (err) => {
        this.errorMessage = err.message || 'Failed to retrieve ChatGPT Key';
      },
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userView');
    this.router.navigate(['/login']);
  }

  switchView(): void {
    const newView: UserView =
      this.currentView === 'campaigns' ? 'landlord' : 'campaigns';
    this.userViewService.switchView(newView);
    this.router.navigate([newView]);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    if (!event.target.closest('.avatar-container') && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }
}
