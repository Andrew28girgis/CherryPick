import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/core/services/places.service';

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

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    // Get contactId first
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
    } else {
      console.error('No contactId found in localStorage');
      this.contactId = 0; // Default value
    }

    // Initialize form after getting contactId
    this.initializeForm();
    
    // Then fetch emails
    if (this.contactId) {
      this.GetContactEmails();
    }
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
      }
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
      country: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  openAddEmailModal() {
    // Reset form but keep contactId
    this.emailForm.reset({
      contactId: this.contactId
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
    // Reset form but preserve contactId
    this.emailForm.reset({
      contactId: this.contactId
    });
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
      country: this.emailForm.value.country,
    };

    console.log('Sending email data:', emailData);

    this.placesService.CreateNewSender(emailData).subscribe({
      next: (response) => {
        console.log('Email added successfully:', response);
        this.isSubmitting = false;
        this.closeModal();
        // Refresh the emails list
        this.GetContactEmails();
        // Add success notification here if you have a toast service
      },
      error: (error) => {
        console.error('Error adding email:', error);
        this.isSubmitting = false;
        // Add error notification here if you have a toast service
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
        // Add success notification here if you have a toast service
      },
      error: (error) => {
        console.error('Error resending verification email:', error);
        this.resendingEmail = null;
        // Add error notification here if you have a toast service
      },
    });
  }

  // Helper method to check if email is pending
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