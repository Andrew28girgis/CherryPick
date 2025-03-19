import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandlordRoutingModule } from './landlord-routing.module';
import { LandlordComponent } from './landlord.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: LandlordComponent }, // Default route for this module
];

@NgModule({
  declarations: [
    LandlordComponent
  ],
  imports: [
    CommonModule,
    LandlordRoutingModule,
    RouterModule.forChild(routes),
  ]
})
export class LandlordModule { }
