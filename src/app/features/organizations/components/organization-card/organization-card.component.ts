import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-organization-card',
  templateUrl: './organization-card.component.html',
  styleUrl: './organization-card.component.css',
})
export class OrganizationCardComponent {
  constructor(private offcanvasService: NgbOffcanvas) {}

  protected openOrganizationOffcanvas(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'end' });
  }
}
