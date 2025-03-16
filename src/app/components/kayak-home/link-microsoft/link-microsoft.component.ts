import { CommonModule } from '@angular/common';
import { Component, NgZone, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/shared/services/places.service';
import { MicrosoftMailsService } from 'src/app/shared/services/microsoft-mails.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MicrosoftLoginService } from 'src/app/shared/services/microsoft-login.service';

@Component({
  selector: 'app-link-microsoft',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  providers: [
    MicrosoftMailsService,
    NgxSpinnerService,
    MicrosoftLoginService,
    PlacesService,
  ],
  templateUrl: './link-microsoft.component.html',
  styleUrl: './link-microsoft.component.css',
})
export class LinkMicrosoftComponent implements OnInit {
  @Output() buttonClicked: EventEmitter<void> = new EventEmitter();
  user: boolean = false;
  public ContactFolders: any;
  public ContactInfos: any;
  emailsList: { email: string; isAdded: boolean }[] = [];
  domainList: { domain: string; isAdded: boolean }[] = [];
  contactId: any;
  RemoveLinked: any;
  MicrosoftLoginResponse: any;
  url : any;

  constructor(
    public spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private microsoftLogin: MicrosoftLoginService,
    private microsoftMailsService: MicrosoftMailsService,
    private ngZone: NgZone
  ) { }

  async ngOnInit() {
    this.user = localStorage.getItem('accountMicrosoftLinked') === 'true';
    this.contactId = localStorage.getItem('contactId');
    this.url = this.microsoftLogin.getSigninUrl(this.contactId);
    this.CheckMicrosoftLinked();
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
    this.spinner.show();
    const body: any = {
      Name: 'MicrosoftSignOut',
      Params: {
        ContactId: this.contactId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        localStorage.setItem('accountMicrosoftLinked', 'false');
        this.CheckMicrosoftLinked();
        this.ngZone.run(() => {
          this.user = false;
        });
        this.spinner.hide();
      },
    });
  }

  CheckMicrosoftLinked() {
    this.spinner.show();
    const body: any = {
      Name: 'CheckMicrosoftLinked',
      Params: {
        ContactId: this.contactId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        localStorage.setItem('accountMicrosoftLinked', data.json[0].accountMicrosoftLinked);
        this.ngZone.run(() => {
          this.user = data.json[0].accountMicrosoftLinked;
        });
        if(this.user === true){
          this.GetContactFolders();
          this.GetContactInfos();
        }
        this.spinner.hide();
      },
    });
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
    } catch (error) { }
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
    this.microsoftMailsService.AddFolderToBeRead(payload).subscribe(() => { });
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
