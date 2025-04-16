import { Component, Input } from '@angular/core';
import { Center } from 'src/app/shared/models/shoppingCenters';

@Component({
  selector: 'app-contact-broker',
  templateUrl: './contact-broker.component.html',
  styleUrl: './contact-broker.component.css',
})
export class ContactBrokerComponent {
  @Input() center!: Center;
}
