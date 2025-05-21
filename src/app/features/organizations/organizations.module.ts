import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrganizationsRoutingModule } from './organizations-routing.module';
import { OrganizationsListComponent } from './components/organizations-list/organizations-list.component';
import { OrganizationCardComponent } from './components/organization-card/organization-card.component';


@NgModule({
  declarations: [
    OrganizationsListComponent,
    OrganizationCardComponent
  ],
  imports: [
    CommonModule,
    OrganizationsRoutingModule
  ]
})
export class OrganizationsModule { }
