import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Center } from 'src/app/shared/models/shoppingCenters';

@Component({
  selector: 'app-contact-broker',
  templateUrl: './contact-broker.component.html',
  styleUrl: './contact-broker.component.css',
})
export class ContactBrokerComponent {
  protected stepperSteps: number[] = Array.from({ length: 3 }, (_, i) => i + 1);
  protected currentStep: number = 1;

  @Input() center!: Center;

  constructor(private activeModal: NgbActiveModal) {}

  closeActiveModal() {
    this.activeModal.close();
  }
}
