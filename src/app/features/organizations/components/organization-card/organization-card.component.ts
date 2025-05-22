import { Component, Input, TemplateRef } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { IOrganization } from '../../models/iorganization';

@Component({
  selector: 'app-organization-card',
  templateUrl: './organization-card.component.html',
  styleUrl: './organization-card.component.css',
})
export class OrganizationCardComponent {
  @Input() organization!: IOrganization;

  constructor(private offcanvasService: NgbOffcanvas) {}

  protected openOrganizationOffcanvas(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'end' });
  }
}
