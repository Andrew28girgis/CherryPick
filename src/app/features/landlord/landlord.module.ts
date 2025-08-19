import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandlordRoutingModule } from './landlord-routing.module';
import { LandlordComponent } from './landlord.component';
import { ManagePropertiesComponent } from './manage-properties/manage-properties.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxFileDropModule } from 'ngx-file-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    LandlordComponent,
    ManagePropertiesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgxFileDropModule,
    NgbModule,
    LandlordRoutingModule,
  ]
})
export class LandlordModule { }
