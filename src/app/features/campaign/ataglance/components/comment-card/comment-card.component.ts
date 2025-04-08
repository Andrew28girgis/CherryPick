import { Component, Input } from '@angular/core';
import { IcampaignComment } from '../../models/icampaign-comment';

@Component({
  selector: 'app-comment-card',
  templateUrl: './comment-card.component.html',
  styleUrl: './comment-card.component.css',
})
export class CommentCardComponent {
  @Input() comment!: IcampaignComment;
}
