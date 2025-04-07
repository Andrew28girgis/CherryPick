import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CampaignRoutingModule } from './campaign-routing.module';
import { CampaignDrawingComponent } from './campaign-drawing/campaign-drawing.component';
import { CampaignManagerComponent } from './campaign-manager/campaign-manager.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SelectButtonModule } from 'primeng/selectbutton';

@NgModule({
  declarations: [CampaignDrawingComponent, CampaignManagerComponent],
  imports: [
    CommonModule,
    CampaignRoutingModule,
    FormsModule,
    NgxSpinnerModule,
    SelectButtonModule,
  ],
})
export class CampaignModule {}
