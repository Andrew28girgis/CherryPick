import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KayakRoutingModule } from './kayak-routing.module';
import { KayakHomeComponent } from './kayak-home.component';
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { NgbCollapseModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SocialViewComponent } from './shopping-center-table/social-view/social-view.component';
import { TableViewComponent } from './shopping-center-table/table-view/table-view.component';
import { CardViewComponent } from './shopping-center-table/card-view/card-view.component';
import { SideListViewComponent } from './shopping-center-table/side-list-view/side-list-view.component';
import { MapViewComponent } from './shopping-center-table/map-view/map-view.component';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { LinkMicrosoftComponent } from '../emily/link-microsoft/link-microsoft.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component';
import { KanbanModule } from '../kanban/kanban.module';
import { KanbanViewComponent } from './shopping-center-table/kanban-view/kanban-view.component';
import { ContactBrokerComponent } from './shopping-center-table/contact-broker/contact-broker.component';
import { ChooseBrokerComponent } from './shopping-center-table/contact-broker/components/choose-broker/choose-broker.component';
import { ManagedByBrokerComponent } from './shopping-center-table/contact-broker/components/managed-by-broker/managed-by-broker.component';
import { GenerateEmailComponent } from './shopping-center-table/contact-broker/components/generate-email/generate-email.component';
import { PreviewEmailComponent } from './shopping-center-table/contact-broker/components/preview-email/preview-email.component';
@NgModule({
  declarations: [
    KayakHomeComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    SocialViewComponent,
    TableViewComponent,
    CardViewComponent,
    SideListViewComponent,
    MapViewComponent,
    KanbanViewComponent,
    ContactBrokerComponent,
    ChooseBrokerComponent,
    ManagedByBrokerComponent,
    GenerateEmailComponent,
    PreviewEmailComponent,
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
    AccordionModule,
    TableModule,
    CardModule,
    PaginatorModule,
    KanbanModule,
    NgbCollapseModule
  ],
  exports: [
    KayakHomeComponent,
    ShoppingCenterTableComponent,
    BuyboxRelatiosComponent,
    SocialViewComponent,
    TableViewComponent,
    CardViewComponent,
    SideListViewComponent,
    MapViewComponent,
    LinkMicrosoftComponent,
  ],
})
export class KayakModule {}
