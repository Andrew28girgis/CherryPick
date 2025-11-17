import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/core/services/places.service';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-emails',
  templateUrl: './emails.component.html',
  styleUrls: ['./emails.component.css'],
})
export class EmailsComponent implements OnInit {
  @ViewChild('addEmailTemplate') addEmailTemplate!: TemplateRef<any>;

  emailForm!: FormGroup;
  modalRef!: NgbModalRef;
  isSubmitting = false;
  contactId!: number;
  emailsList: any[] = [];
  isLoadingEmails = false;
  resendingEmail: string | null = null;

  // Autocomplete properties
  citySuggestions: any[] = [];
  isLoadingCities = false;
  showCitySuggestions = false;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
    } else {
      console.error('No contactId found in localStorage');
      this.contactId = 0;
    }

    this.initializeForm();

    if (this.contactId) {
      this.GetContactEmails();
    }

    // Setup city autocomplete
    this.setupCityAutocomplete();
  }

  setupCityAutocomplete() {
    this.emailForm
      .get('city')
      ?.valueChanges.pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        switchMap((value) => {
          if (value && value.length >= 2) {
            this.isLoadingCities = true;
            return this.fetchCitySuggestions(value);
          } else {
            this.citySuggestions = [];
            this.showCitySuggestions = false;
            return of([]);
          }
        })
      )
      .subscribe({
        next: (suggestions) => {
          this.citySuggestions = this.removeDuplicateCities(suggestions);
          this.showCitySuggestions = suggestions.length > 0;
          this.isLoadingCities = false;
        },
        error: (error) => {
          console.error('Error fetching city suggestions:', error);
          this.isLoadingCities = false;
          this.citySuggestions = [];
          this.showCitySuggestions = false;
        },
      });
  }
  removeDuplicateCities(cities: any[]) {
  const unique = new Map(); // City name → object

  for (const c of cities) {
    if (!unique.has(c.City)) {
      unique.set(c.City, c);
    }
  }

  return Array.from(unique.values());
}

  fetchCitySuggestions(input: string) {
    const body: any = {
      Name: 'AutoComplePolygonCityState',
      MainEntity: null,
      Params: {
        input: input,
      },
      Json: null,
    };

    return this.placesService.BetaGenericAPI(body).pipe(
      switchMap((data: any) => {
        console.log('City/State fetched:', data.json);
        return of(data.json || []);
      })
    );
  }

  selectCity(city: any) {
    this.emailForm.patchValue({
      city: city.City,
    });

    this.showCitySuggestions = false;
  }

  onCityInputBlur() {
    // Delay hiding suggestions to allow click event to fire
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 200);
  }

  GetContactEmails() {
    this.isLoadingEmails = true;
    const body: any = {
      Name: 'GetContactEmails',
      MainEntity: null,
      Params: {
        Id: this.contactId,
      },
      Json: null,
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        console.log('Emails fetched:', data.json);
        this.emailsList = data.json || [];
        console.log('Emails list set:', this.emailsList);
        this.isLoadingEmails = false;
      },
      error: (error) => {
        console.error('Error fetching emails:', error);
        this.emailsList = [];
        this.isLoadingEmails = false;
      },
    });
  }

  initializeForm() {
    this.emailForm = this.fb.group({
      contactId: [this.contactId, Validators.required],
      nickname: ['', [Validators.required, Validators.maxLength(100)]],
      fromEmail: ['', [Validators.required, Validators.email]],
      fromName: ['', [Validators.required, Validators.maxLength(100)]],
      replyTo: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  openAddEmailModal() {
    this.emailForm.reset({
      contactId: this.contactId,
    });

    this.modalRef = this.modalService.open(this.addEmailTemplate, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.dismiss();
    }
    this.emailForm.reset({
      contactId: this.contactId,
    });
    this.citySuggestions = [];
    this.showCitySuggestions = false;
  }

  onSubmit() {
    console.log('Form submitted');
    console.log('Form valid:', this.emailForm.valid);
    console.log('Form values:', this.emailForm.value);

    if (this.emailForm.invalid) {
      console.log('Form is invalid, marking all fields as touched');
      Object.keys(this.emailForm.controls).forEach((key) => {
        const control = this.emailForm.get(key);
        control?.markAsTouched();
        if (control?.invalid) {
          console.log(`${key} is invalid:`, control.errors);
        }
      });
      return;
    }

    this.isSubmitting = true;

    const emailData = {
      contactId: this.emailForm.value.contactId,
      nickname: this.emailForm.value.nickname,
      fromEmail: this.emailForm.value.fromEmail,
      fromName: this.emailForm.value.fromName,
      replyTo: this.emailForm.value.replyTo,
      address: this.emailForm.value.address,
      city: this.emailForm.value.city,
      country: 'USA',
    };

    console.log('Sending email data:', emailData);

    this.placesService.CreateNewSender(emailData).subscribe({
      next: (response) => {
        console.log('Email added successfully:', response);
        this.isSubmitting = false;
        this.closeModal();
        this.GetContactEmails();
      },
      error: (error) => {
        console.error('Error adding email:', error);
        this.isSubmitting = false;
      },
    });
  }

  resendEmail(selectedEmail: any) {
    this.resendingEmail = selectedEmail.email;
    const emailData = {
      contactId: this.contactId,
      email: selectedEmail.email,
    };
    this.placesService.ResendVerificationCode(emailData).subscribe({
      next: (response) => {
        console.log('Verification email resent successfully:', response);
        this.resendingEmail = null;
      },
      error: (error) => {
        console.error('Error resending verification email:', error);
        this.resendingEmail = null;
      },
    });
  }

  isPending(status: string): boolean {
    return !!(status && status.toLowerCase() === 'pending');
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.emailForm.get(fieldName);
    return !!(
      field &&
      field.hasError(errorType) &&
      (field.dirty || field.touched)
    );
  }

  getControl(fieldName: string) {
    return this.emailForm.get(fieldName);
  }
}
