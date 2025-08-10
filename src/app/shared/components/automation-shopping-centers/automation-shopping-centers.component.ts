import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-automation-shopping-centers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './automation-shopping-centers.component.html',
  styleUrl: './automation-shopping-centers.component.css',
})
export class AutomationShoppingCentersComponent implements OnInit {
  automationId!: number;
  automationData: any;
  currentTenantPage = 1;
  tenantsPerPage = 5;
  currentSpacePage = 1;
  spacesPerPage = 5;

  constructor(
    public activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const id = params['automationId'];
      this.automationId = id;
    });
    this.GetAutomationResponseForShoppingCenter();
  }
  GetAutomationResponseForShoppingCenter(): void {
    const body: any = {
      Name: 'GetAutomationResponseForShoppingCenter',
      Params: {
        Id: this.automationId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        try {
          const rawJson = data.json[0].automationJsonResponse;
          this.automationData = JSON.parse(rawJson); // ✅ Convert string to object
          console.log('Parsed Automation Data:', this.automationData);
        } catch (error) {
          console.error('Failed to parse automationJsonResponse:', error);
        }
      },
    });
  }
  //////////////
  performClose() {
    if ((window as any).chrome?.webview?.postMessage) {
      (window as any).chrome.webview.postMessage('close-automation-window');
      console.log('Close message sent to webview');
    } else {
      console.warn('chrome.webview is not available on this platform');
    }
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    } else {
      console.warn('Toast elements not found in DOM.');
    }
  }
  get paginatedTenants(): any[] {
    if (!this.automationData?.tenants) return [];
    const start = (this.currentTenantPage - 1) * this.tenantsPerPage;
    return this.automationData.tenants.slice(
      start,
      start + this.tenantsPerPage
    );
  }

  get totalTenantPages(): number {
    if (!this.automationData?.tenants) return 0;
    return Math.ceil(this.automationData.tenants.length / this.tenantsPerPage);
  }

  changeTenantPage(delta: number): void {
    const newPage = this.currentTenantPage + delta;
    if (newPage >= 1 && newPage <= this.totalTenantPages) {
      this.currentTenantPage = newPage;
    }
  }
  get paginatedSpaces(): any[] {
    if (!this.automationData?.availableSpaces) return [];
    const start = (this.currentSpacePage - 1) * this.spacesPerPage;
    return this.automationData.availableSpaces.slice(
      start,
      start + this.spacesPerPage
    );
  }

  get totalSpacePages(): number {
    if (!this.automationData?.availableSpaces) return 0;
    return Math.ceil(
      this.automationData.availableSpaces.length / this.spacesPerPage
    );
  }

  changeSpacePage(delta: number): void {
    const newPage = this.currentSpacePage + delta;
    if (newPage >= 1 && newPage <= this.totalSpacePages) {
      this.currentSpacePage = newPage;
    }
  }
}
