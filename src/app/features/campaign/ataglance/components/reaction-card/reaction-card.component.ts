import { Component, Input } from '@angular/core';
import { IcampaignReaction } from '../../models/icampaign-reaction';

@Component({
  selector: 'app-reaction-card',
  templateUrl: './reaction-card.component.html',
  styleUrl: './reaction-card.component.css',
})
export class ReactionCardComponent {
  @Input() reaction!: IcampaignReaction;
}
