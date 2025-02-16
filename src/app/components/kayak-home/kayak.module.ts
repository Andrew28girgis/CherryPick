import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KayakRoutingModule } from './kayak-routing.module';
import { KayakHomeComponent } from './kayak-home.component';
import { EmilyComponent } from './emily/emily.component';
import { BuyboxDetailsComponent } from './buybox-details/buybox-details.component';
import { WorkSpacesComponent } from './work-spaces/work-spaces.component';
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { KayakComponent } from './kayak/kayak.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EmilyOrgComponent } from './emily-org/emily-org.component';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';

@NgModule({
  declarations: [
    KayakHomeComponent,
    EmilyComponent,
    BuyboxDetailsComponent,
    WorkSpacesComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    KayakComponent,
    EmilyOrgComponent,
  ],
  imports: [
    CommonModule,
    KayakRoutingModule,
    FormsModule,
    NgbModule,
    NgbTooltipModule,
    NgxSpinnerModule,
    ToastrModule.forRoot(),
    SharedModule,
    ButtonModule,
    CarouselModule,
  ],
  exports: [
    KayakHomeComponent,
    EmilyComponent,
    BuyboxDetailsComponent,
    WorkSpacesComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    EmilyOrgComponent,
  ],
})
export class KayakModule {}
