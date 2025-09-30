import { Component, Input, TemplateRef } from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from 'src/app/shared/models/tenant';
import { AddCampaignPopupComponent } from '../../campaign/add-campaign-popup/add-campaign-popup.component';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-tenant-card',

  templateUrl: './tenant-card.component.html',
  styleUrls: ['./tenant-card.component.css'],})
export class TenantCardComponent {
  @Input() tenant!: Tenant;

  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;

  constructor(
    private offcanvasService: NgbOffcanvas,
    private modalService: NgbModal,
    private notificationService:NotificationService
  ) {}

  getImageUrl(id: number): string {
    return 'https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=' + id;
  }

  onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  checkImage(event: Event) {
    const img = event.target as HTMLImageElement;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      let isWhite = true;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (!(r > 240 && g > 240 && b > 240 && a > 0)) {
          isWhite = false;
          break;
        }
      }

      if (isWhite) {
        img.src = 'assets/Images/placeholder.png';
      }
    } catch (err) {
      if (img.naturalWidth <= 5 && img.naturalHeight <= 5) {
        img.src = 'assets/Images/placeholder.png';
      }
    }
  }

  protected openOffcanvas(content: TemplateRef<any>): void {
    this.offcanvasService.open(content, {
      position: 'end',
      panelClass: 'offcanvas-panel-class',
    });
  }

  protected openCampaignModal(): void {
    const modalRef = this.modalService.open(AddCampaignPopupComponent, {
      centered: true,
    });
  
    modalRef.componentInstance.organizationId = this.tenant.id;
  
    // 👇 inject a callback so popup can call it
    modalRef.componentInstance.closeOffcanvasFn = () => this.closeOffcanvas();
  }
  protected closeOffcanvas(): void {
    this.offcanvasService.dismiss();
  }
  handleClick(tenant: any, event: Event, offcanvasContent: any) {
    if (tenant.Campaigns && tenant.Campaigns.length > 0) {
      this.openOffcanvas(offcanvasContent);
      event.stopPropagation();
    }
  }
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  openEmilyWithMap() {
    this.notificationService.setChatOpen(true);  // ensure Emily is open
    this.notificationService.setMapOpen(true);   // force map overlay
    this.notificationService.setOverlayWide(true); // force 92vw
    this.closeOffcanvas()
  }
  closeEmily() {
    this.notificationService.setChatOpen(false);
   }
}
