import { Component, Input } from '@angular/core';
import { ICampaignEmail } from '../../models/icampaign-email';

@Component({
  selector: 'app-todo-card',
  templateUrl: './todo-card.component.html',
  styleUrl: './todo-card.component.css',
})
export class TodoCardComponent {
  @Input() email!: ICampaignEmail;
}
