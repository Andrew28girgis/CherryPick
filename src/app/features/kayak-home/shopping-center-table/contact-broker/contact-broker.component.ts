import { Component, ElementRef, Input, ViewChild } from '@angular/core';
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
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  protected stepperSteps: number[] = Array.from({ length: 3 }, (_, i) => i + 1);
  protected currentStep: number = 1;
  protected chooseBrokerObject!: IChooseBroker;
  protected managedByBrokerArray!: IManagedByBroker[];
  protected mailContextId!: number;

  @Input() center!: Center;
  // @Input() buyboxId!: number;

  constructor(private activeModal: NgbActiveModal) {}

  onStepDone(event: any): void {
    this.closeActiveModal();
    // switch (this.currentStep) {
    //   case 1: {
    //     this.chooseBrokerObject = event;
    //     this.currentStep++;
    //     break;
    //   }
    //   case 2: {
    //     this.managedByBrokerArray = event;
    //     this.currentStep++;
    //     break;
    //   }
    //   case 3: {
    //     this.closeActiveModal();
    //     break;
    //   }
    //   // case 4: {
    //   //   this.closeActiveModal();
    //   //   break;
    //   // }

    //   default:
    //     break;
    // }
  }

  closeActiveModal() {
    this.activeModal.close();
  }

  onScrollDown(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }
}
