import { Component, Input, TemplateRef } from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from 'src/app/shared/models/tenant';
import { AddCampaignPopupComponent } from '../../campaign/add-campaign-popup/add-campaign-popup.component';

@Component({
  selector: 'app-tenant-card',

  templateUrl: './tenant-card.component.html',
  styleUrl: './tenant-card.component.css',
})
export class TenantCardComponent {
  @Input() tenant!: Tenant;

  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;

  constructor(
    private offcanvasService: NgbOffcanvas,
    private modalService: NgbModal
  ) {}

  protected onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  protected openOffcanvas(content: TemplateRef<any>): void {
    console.log(this.tenant);

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
  }

  protected closeOffcanvas(): void {
    this.offcanvasService.dismiss();
  }
}
