import { Component, Input, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from 'src/app/shared/models/tenant';

@Component({
  selector: 'app-tenant-card',

  templateUrl: './tenant-card.component.html',
  styleUrl: './tenant-card.component.css',
})
export class TenantCardComponent {
  @Input() tenant!: Tenant;

  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;

  constructor(private offcanvasService: NgbOffcanvas,private modalService:NgbModal,private router:Router) {}

  protected onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  protected openOffcanvas(content: TemplateRef<any>): void {
    this.offcanvasService.open(content, {
      position: 'end',
      panelClass: 'offcanvas-panel-class',
    });
  }


  protected openCampaignModal(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  protected navigateToCampaign(): void {
    this.modalService.dismissAll();
    this.offcanvasService.dismiss();
    this.router.navigate(['/campaigns/add-campaign', this.tenant.id], {
      queryParams: {
        minSize: this.campaignMinSize,
        maxSize: this.campaignMaxSize,
      },
    });
  }
}
