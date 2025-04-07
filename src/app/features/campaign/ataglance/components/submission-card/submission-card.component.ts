import { Component, Input } from '@angular/core';
import { IcampaignSubmission } from '../../models/icampaign-submission';

@Component({
  selector: 'app-submission-card',
  templateUrl: './submission-card.component.html',
  styleUrl: './submission-card.component.css',
})
export class SubmissionCardComponent {
  @Input() submission!: IcampaignSubmission;
}
