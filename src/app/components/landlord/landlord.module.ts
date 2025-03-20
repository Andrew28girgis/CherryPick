import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandlordRoutingModule } from './landlord-routing.module';
import { LandlordComponent } from './landlord.component';

@NgModule({
  declarations: [
    LandlordComponent
  ],
  imports: [
    CommonModule,
    LandlordRoutingModule,
  ]
})
export class LandlordModule { }
