import {
  Component,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/core/services/places.service';
import { EmailPollingService } from 'src/app/core/services/email-polling.service';

@Component({
  selector: 'app-emails',
  templateUrl: './emails.component.html',
  styleUrls: ['./emails.component.css'],
})
export class EmailsComponent implements OnInit, OnDestroy {
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
    private placesService: PlacesService,
    private emailPollingService: EmailPollingService
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
  }

  ngOnDestroy() {
    // Stop polling when component is destroyed
    this.emailPollingService.stopPolling();
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
        this.emailsList = data.json || [];
        this.isLoadingEmails = false;
        this.checkAndStartPolling();
      },
    });
  }

  private checkAndStartPolling() {
    const hasPendingEmails = this.emailsList.some((email) =>
      this.isPending(email.status)
    );
    if (hasPendingEmails) {
      this.emailPollingService.startPolling(this.contactId, (emails) => {
        this.emailsList = emails;
        // console.log('Emails updated via polling:', this.emailsList);
      });
    } else {
      this.emailPollingService.stopPolling();
    }
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
  }

  onSubmit() {
    if (this.emailForm.invalid) {
      this.showToast('Form is invalid, marking all fields as touched');
      Object.keys(this.emailForm.controls).forEach((key) => {
        const control = this.emailForm.get(key);
        control?.markAsTouched();
        if (control?.invalid) {
          this.showToast(
            `${key} is invalid: ${JSON.stringify(control.errors)}`
          );
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

    this.placesService.CreateNewSender(emailData).subscribe({
      next: (response) => {
        this.showToast('Email added successfully');
        this.isSubmitting = false;
        this.closeModal();
        this.GetContactEmails();
      },
      error: (error) => {
        this.showToast('Error adding email. Please try again.');
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
        this.showToast('Verification email resent successfully');
        this.resendingEmail = null;
        this.checkAndStartPolling();
      },
      error: (error) => {
        this.showToast('Error resending verification email. Please try again.');
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
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage && toast) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }
}
