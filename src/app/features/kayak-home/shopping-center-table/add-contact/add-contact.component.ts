import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.css'],
})
export class AddContactComponent {
  @Input() shoppingCenterId!: number;
  @Output() contactCreated = new EventEmitter<any>();

  newContact: any = {
    firstname: '',
    lastname: '',
    email: '',
    shoppingCenterId: '',
  };

  constructor(
    public activeModal: NgbActiveModal,
    private placesService: PlacesService
  ) {}

  ngOnInit(): void {
    this.newContact.shoppingCenterId = this.shoppingCenterId;
  }

  CreateContact(): void {
    if (
      this.newContact.firstname &&
      this.newContact.email &&
      this.newContact.shoppingCenterId
    ) {
      const params = {
        name: 'CreateContact',
        mainEntity: null,
        params: {
          FirstName: this.newContact.firstname,
          LastName: this.newContact.lastname,
          ShoppingCenterId: this.newContact.shoppingCenterId,
          Email: this.newContact.email,
        },
        json: null,
      };

      this.placesService.GenericAPI(params).subscribe(
        (response: any) => {
          if (response.error) {
            console.error('Error from API:', response.error);
          } else {
            this.contactCreated.emit(response);
            this.activeModal.close(response);
            this.resetForm();
          }
        },
        (error) => {
          console.error('Error creating contact:', error);
        }
      );
    }
  }

  resetForm(): void {
    this.newContact = {
      firstname: '',
      lastname: '',
      email: '',
      shoppingCenterId: this.shoppingCenterId,
    };
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }
}
