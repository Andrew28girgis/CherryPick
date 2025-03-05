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
import { SocialViewComponent } from './shopping-center-table/social-view/social-view.component';
import { TableViewComponent } from './shopping-center-table/table-view/table-view.component';
import { CardViewComponent } from './shopping-center-table/card-view/card-view.component';
import { SideListViewComponent } from './shopping-center-table/side-list-view/side-list-view.component';
import { MapViewComponent } from './shopping-center-table/map-view/map-view.component';
import { PolygonsControllerComponent } from './polygons-controller/polygons-controller.component';
import { LinkMicrosoftComponent } from './link-microsoft/link-microsoft.component';
import { StageEmailComponent } from './stage-email/stage-email.component';
import { EditorEmailComponent } from './editor-email/editor-email.component';
import { EmailDashboardComponent } from './email-dashboard/email-dashboard.component';

@NgModule({
  declarations: [
    KayakHomeComponent,
    BuyboxDetailsComponent,
    WorkSpacesComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    KayakComponent,
    EmilyOrgComponent,
    SocialViewComponent,
    TableViewComponent,
    CardViewComponent,
    SideListViewComponent,
    MapViewComponent,
    PolygonsControllerComponent,
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
    LinkMicrosoftComponent,
    StageEmailComponent,
    EmailDashboardComponent,
    EditorEmailComponent,

    EmilyComponent,
  ],
  exports: [
    KayakHomeComponent,
    BuyboxDetailsComponent,
    WorkSpacesComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    EmilyOrgComponent,
    SocialViewComponent,
    TableViewComponent,
    CardViewComponent,
    SideListViewComponent,
    MapViewComponent,
    StageEmailComponent,
    EmailDashboardComponent,
  ],
})
export class KayakModule {}
