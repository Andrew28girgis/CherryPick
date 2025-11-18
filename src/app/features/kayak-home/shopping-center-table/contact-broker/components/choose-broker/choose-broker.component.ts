import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ManagerOrganization } from 'src/app/shared/models/shoppingCenters';
import { IChooseBroker } from '../../models/ichoose-broker';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-choose-broker',
  templateUrl: './choose-broker.component.html',
  styleUrl: './choose-broker.component.css',
})
export class ChooseBrokerComponent implements OnChanges {
  protected selectedContacts: Map<number, ManagerOrganization> = new Map<
    number,
    ManagerOrganization
  >();
  protected sendAsTo: boolean = false;
  protected sendAsCC: boolean = true;

  @Input() contacts!: ManagerOrganization[];
  @Output() onStepDone = new EventEmitter<IChooseBroker>();

  constructor(
    private placeService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.contacts.forEach((contact) =>
      this.selectedContacts.set(contact.ContactId, contact)
    );
  }

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

  getContactsByOrgID(): void {
    this.spinner.show();
    const body = {
      Name: 'GetAllContactsByOrganizationId',
      Params: {
        OrganizationId: this.contacts[0].Id,
      },
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        let newContacts: ManagerOrganization[] = response.json;
        newContacts = newContacts.filter(
          (c: ManagerOrganization) =>
            !this.contacts.find(
              (contact: ManagerOrganization) => contact.ContactId == c.ContactId
            )
        );
        this.contacts = [...this.contacts, ...newContacts];
      }
    });
  }

  onSubmit(): void {
    const selectedContacts = Array.from(this.selectedContacts.values());
    if (selectedContacts.length == 0) {
      alert('Please select at least one contact');
      return;
    }
    const object: IChooseBroker = {
      selectedContacts: selectedContacts,
      sendAsTo: this.sendAsTo,
      sendAsCC: this.sendAsCC,
    };
    this.onStepDone.emit(object);
  }
}
