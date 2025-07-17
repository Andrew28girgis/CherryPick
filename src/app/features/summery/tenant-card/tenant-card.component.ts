import { Component, Input, TemplateRef } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from 'src/app/shared/models/tenant';

@Component({
  selector: 'app-tenant-card',

  templateUrl: './tenant-card.component.html',
  styleUrl: './tenant-card.component.css',
})
export class TenantCardComponent {
  @Input() tenant!: Tenant;

  constructor(private offcanvasService: NgbOffcanvas) {}

  protected onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  protected openOffcanvas(content: TemplateRef<any>): void {
    this.offcanvasService.open(content, {
      position: 'end',
      panelClass: 'offcanvas-panel-class',
    });
  }
}
