import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AtaglanceRoutingModule } from './ataglance-routing.module';
import { AtaglanceComponent } from './ataglance.component';
import { CommentCardComponent } from './components/comment-card/comment-card.component';
import { ReactionCardComponent } from './components/reaction-card/reaction-card.component';
import { SubmissionCardComponent } from './components/submission-card/submission-card.component';
import { TodoCardComponent } from './components/todo-card/todo-card.component';


@NgModule({
  declarations: [
    AtaglanceComponent,
    CommentCardComponent,
    ReactionCardComponent,
    SubmissionCardComponent,
    TodoCardComponent
  ],
  imports: [
    CommonModule,
    AtaglanceRoutingModule
  ]
})
export class AtaglanceModule { }
