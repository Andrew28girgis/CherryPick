import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrganizationsRoutingModule } from './organizations-routing.module';
import { OrganizationsListComponent } from './components/organizations-list/organizations-list.component';
import { OrganizationCardComponent } from './components/organization-card/organization-card.component';
import { PaginatorModule } from 'primeng/paginator';

@NgModule({
  declarations: [OrganizationsListComponent, OrganizationCardComponent],
  imports: [CommonModule, OrganizationsRoutingModule, PaginatorModule],
})
export class OrganizationsModule {}
