import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertiesListComponent } from './components/properties-list/properties-list.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { PropertyCardComponent } from './components/property-card/property-card.component';

@NgModule({
  declarations: [PropertiesListComponent,PropertyCardComponent],
  imports: [
    CommonModule,
    PropertiesRoutingModule,
    NgxSpinnerModule,
    NgbDropdownModule,
  ],
})
export class PropertiesModule {}
