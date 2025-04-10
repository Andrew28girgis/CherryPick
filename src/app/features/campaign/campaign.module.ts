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

@NgModule({
  declarations: [CampaignDrawingComponent, CampaignManagerComponent],
  imports: [
    CommonModule,
    CampaignRoutingModule,
    FormsModule,
    NgxSpinnerModule,
    SelectButtonModule,
    DragDropModule,
    NgbCollapseModule
  ],
})
export class CampaignModule {}
