import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/shared/services/places.service';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, BrowserAuthError } from '@azure/msal-browser';
import { MicrosoftMailsService } from 'src/app/shared/services/microsoft-mails.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-link-microsoft',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  providers: [
    MicrosoftMailsService,
    NgxSpinnerService,
    MsalService,
    PlacesService,
  ],
  templateUrl: './link-microsoft.component.html',
  styleUrl: './link-microsoft.component.css',
})
export class LinkMicrosoftComponent implements OnInit {
  @Output() buttonClicked: EventEmitter<void> = new EventEmitter();
  user: any = null;
  public ContactFolders: any;
  public ContactInfos: any;
  emailsList: { email: string; isAdded: boolean }[] = [];
  domainList: { domain: string; isAdded: boolean }[] = [];
  contactId: any;
  RemoveLinked: any;

  constructor(
    public spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private msalService: MsalService,
    private microsoftMailsService: MicrosoftMailsService
  ) {}

  async ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    this.msalService.instance.handleRedirectPromise().then((response) => {
      if (response) {
        this.msalService.instance.setActiveAccount(response.account);
      }
      this.getUser();

      const refreshToken = localStorage.getItem('RefreshToken');
      const accessToken = localStorage.getItem('access_token');

      if (refreshToken && accessToken) {
        this.GetContactFolders();
        this.GetContactInfos();
      }
    });
  }

  onClick() {
    this.buttonClicked.emit();
  }

  RemoveLinkedAccount() {
    this.spinner.show();

    const body: any = {
      Name: 'RemoveLinkedAccount',
      MainEntity: null,
      Params: {
        ContactId: this.contactId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
        this.spinner.hide();
      },
    });
  }

  async waitForMsalInitialization() {
    if (!this.msalService.instance) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async loginMicrosoft(): Promise<void> {
    const msalInstance = this.msalService.instance;

    // If an active account already exists, no need to log in again.
    if (msalInstance.getActiveAccount()) {
      return;
    }

    try {
      const response = await msalInstance.loginPopup({
        scopes: [
          'User.Read',
          'offline_access',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/Mail.Read',
        ],
      });

      const account = response?.account;

      // Ensure that account information is present.
      if (!account) {
        throw new Error(
          'Login succeeded, but no account information was returned.'
        );
      }

      // Set the active account and fetch user details.
      msalInstance.setActiveAccount(account);

      localStorage.setItem('access_token', response.accessToken);

      const refreshTokenKey = this.findRefreshTokenKey();
      if (refreshTokenKey) {
        const refreshToken = sessionStorage.getItem(refreshTokenKey);

        if (refreshToken) {
          const RefreshTokenObject = JSON.parse(refreshToken);
          localStorage.setItem('RefreshToken', RefreshTokenObject.secret);
          this.UpdateContactToReadEmails(
            response.accessToken,
            RefreshTokenObject.secret
          );
        }
      }

      // Call other methods you need.
      this.getUser();
    } catch (error) {
      // Check for specific MSAL error when an interaction is already in progress.
      if (
        error instanceof BrowserAuthError &&
        error.errorCode === 'interaction_in_progress'
      ) {
      } else {
      }
    }
  }

  findRefreshTokenKey() {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.toLowerCase().includes('refreshtoken')) {
        return key;
      }
    }
    return null;
  }

  logoutMicrosoft() {
    this.msalService.logoutPopup().subscribe({
      next: () => {
        this.showToast('User logged out successfully.');
        this.user = null;
        window.close();
        this.RemoveLinkedAccount();
      }
    });
  }

  getUser() {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.user = account;
    } else if (localStorage.getItem('accountMicrosoftLinked')) {
      this.user = true;
    }
  }

  UpdateContactToReadEmails(AccessToken: string, RefreshToken: string): void {
    try {
      this.spinner.show();
      const body: any = {
        Name: 'UpdateContactToReadEmails',
        Params: {
          AccessToken: AccessToken,
          RefreshToken: RefreshToken,
          ContactId: this.contactId,
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (data: any) => {
          this.spinner.hide();
          this.GetContactFolders();
        },
      });
    } catch (error) {
      console.error('Error parsing objectTokeMsal:', error);
    }
  }

  AcceptToReadReplyEmails(canRead: any): void {
    try {
      this.spinner.show();
      const body: any = {
        Name: 'AcceptToReadReplyEmails',
        Params: {
          ContactId: this.contactId,
          CanRead: canRead.target.checked,
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (data: any) => {
          this.spinner.hide();
        },
      });
    } catch (error) {}
  }

  openBodyModalContactFolders(modal: any) {
    this.modalService.open(modal, { size: 'lg', backdrop: true });
  }

  GetContactFolders() {
    this.microsoftMailsService.GetContactFolders(this.contactId).subscribe({
      next: (data: any) => {
        this.ContactFolders = data;
        this.mergeContactFoldersWithInfos();
      },
    });
  }

  GetContactInfos() {
    this.microsoftMailsService.GetContactInfos(this.contactId).subscribe({
      next: (data: any) => {
        this.ContactInfos = data;
        this.mergeContactFoldersWithInfos();
      },
    });
  }

  mergeContactFoldersWithInfos() {
    if (this.ContactFolders && this.ContactInfos) {
      this.ContactFolders.forEach((folder: any) => {
        const contactInfo = this.ContactInfos.readEmailsWithFolderName.find(
          (info: any) => info.folderId === folder.id
        );
        if (contactInfo) {
          folder.isChecked = true;
        } else {
          folder.isChecked = false;
        }
      });

      this.emailsList = [...this.ContactInfos.readEmailsWithFroms];
      this.domainList = [...this.ContactInfos.readEmailsWithDomains];
    }
  }

  AddFolderToBeRead(id: any, displayName: any, IsAdded: any) {
    const payload = {
      ContactId: this.contactId,
      FolderId: id,
      FolderName: displayName,
      IsAdded: IsAdded.target.checked,
    };
    this.microsoftMailsService.AddFolderToBeRead(payload).subscribe(() => {});
  }

  AddEmailsToBeRead(emailInput: HTMLInputElement) {
    const email = emailInput.value.trim();

    if (this.validateEmail(email)) {
      const payload = {
        ContactId: this.contactId,
        Email: email,
        IsAdded: true,
      };

      this.microsoftMailsService.AddEmailsToBeRead(payload).subscribe(() => {
        this.emailsList.push({ email: email, isAdded: true });
        emailInput.value = '';
      });
    } else {
      alert('Please enter a valid email address!');
    }
  }

  deleteEmailsToBeRead(email: string) {
    const payload = {
      ContactId: this.contactId,
      Email: email,
      IsAdded: false,
    };

    this.microsoftMailsService.AddEmailsToBeRead(payload).subscribe(() => {
      this.emailsList = this.emailsList.filter((item) => item.email !== email);
    });
  }

  AddDomainToBeRead(domainInput: HTMLInputElement) {
    const domain = domainInput.value.trim();

    const payload = {
      ContactId: this.contactId,
      Domain: domain,
      IsAdded: true,
    };

    this.microsoftMailsService.AddDomainToBeRead(payload).subscribe(() => {
      this.domainList.push({ domain: domain, isAdded: true });
      domainInput.value = '';
    });
  }

  deleteDomainToBeRead(domain: string) {
    const payload = {
      ContactId: this.contactId,
      Domain: domain,
      IsAdded: false,
    };

    this.microsoftMailsService.AddDomainToBeRead(payload).subscribe(() => {
      this.domainList = this.domainList.filter(
        (item) => item.domain !== domain
      );
    });
  }

  MyInboxlist() {
    const url = '/MyInboxs';
    const newTab = window.open(url, '_blank');

    newTab?.addEventListener('load', () => {
      newTab?.postMessage('*');
    });
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
}
