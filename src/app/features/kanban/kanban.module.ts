import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KanbanRoutingModule } from './kanban-routing.module';
import { TooltipModule } from 'primeng/tooltip';
import { KanbanComponent } from './kanban.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxSpinnerModule } from 'ngx-spinner';

@NgModule({
  declarations: [KanbanComponent],
  imports: [CommonModule, KanbanRoutingModule, TooltipModule,DragDropModule,NgxSpinnerModule],
  exports:[KanbanComponent]
})
export class KanbanModule {}
