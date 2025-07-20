import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CampaignRoutingModule } from './campaign-routing.module';
import { CampaignDrawingComponent } from './campaign-drawing/campaign-drawing.component';
import { CampaignManagerComponent } from './campaign-manager/campaign-manager.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { TooltipModule } from 'primeng/tooltip';
import { AddCampaignComponent } from './add-campaign/add-campaign.component';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { AddNewCampaignComponent } from './add-new-campaign/add-new-campaign.component';
import { AddCampaignPopupComponent } from './add-campaign-popup/add-campaign-popup.component';

@NgModule({
  declarations: [
    CampaignDrawingComponent,
    CampaignManagerComponent,
    AddCampaignComponent,
    AddNewCampaignComponent,
    AddCampaignPopupComponent,
  ],
  imports: [
    CommonModule,
    CampaignRoutingModule,
    FormsModule,
    NgxSpinnerModule,
    SelectButtonModule,
    DragDropModule,
    NgbCollapseModule,
    TooltipModule,
    InputTextModule,
    AutoCompleteModule,
    ButtonModule,
  ],
  exports: [
    CampaignDrawingComponent,
    CampaignManagerComponent,
    AddNewCampaignComponent,
    AddCampaignPopupComponent,
  ],
})
export class CampaignModule {}
