import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ManagerOrganization } from 'src/app/shared/models/shoppingCenters';
import { IChooseBroker } from '../../models/ichoose-broker';

@Component({
  selector: 'app-choose-broker',
  templateUrl: './choose-broker.component.html',
  styleUrl: './choose-broker.component.css',
})
export class ChooseBrokerComponent {
  protected selectedContacts: Map<number, ManagerOrganization> = new Map<
    number,
    ManagerOrganization
  >();
  protected sendAsTo: boolean = true;
  protected sendAsCC: boolean = false;

  @Input() contacts!: ManagerOrganization[];
  @Output() onStepDone = new EventEmitter<IChooseBroker>();

  onContactCheck(event: any, contact: ManagerOrganization): void {
    const checked = event.target.checked;
    if (checked) {
      const exist = this.selectedContacts.has(contact.ContactId);
      if (!exist) {
        this.selectedContacts.set(contact.ContactId, contact);
      }
    } else {
      const exist = this.selectedContacts.has(contact.ContactId);
      if (exist) {
        this.selectedContacts.delete(contact.ContactId);
      }
    }
  }

  onSubmit(): void {
    const selectedContacts = Array.from(this.selectedContacts.values());
    const object: IChooseBroker = {
      selectedContacts: selectedContacts,
      sendAsTo: this.sendAsTo,
      sendAsCC: this.sendAsCC,
    };
    this.onStepDone.emit(object);
  }
}
