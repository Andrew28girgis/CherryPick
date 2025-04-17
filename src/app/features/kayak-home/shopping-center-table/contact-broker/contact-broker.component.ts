import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { IChooseBroker } from './models/ichoose-broker';
import { IManagedByBroker } from './models/imanaged-by-broker';

@Component({
  selector: 'app-contact-broker',
  templateUrl: './contact-broker.component.html',
  styleUrl: './contact-broker.component.css',
})
export class ContactBrokerComponent {
  protected stepperSteps: number[] = Array.from({ length: 3 }, (_, i) => i + 1);
  protected currentStep: number = 1;
  protected chooseBrokerObject!: IChooseBroker;
  protected managedByBrokerArray!: IManagedByBroker[];

  @Input() center!: Center;
  @Input() buyboxId!: number;

  constructor(private activeModal: NgbActiveModal) {}

  onStepDone(event: any): void {
    switch (this.currentStep) {
      case 1: {
        this.chooseBrokerObject = event;
        this.currentStep++;
        break;
      }
      case 2: {
        this.managedByBrokerArray = event;
        this.currentStep++;
        break;
      }
      case 3: {
        this.closeActiveModal();
        break;
      }

      default:
        break;
    }
  }

  closeActiveModal() {
    this.activeModal.close();
  }
}
