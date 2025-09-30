import { Component, OnInit, TemplateRef, OnDestroy } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, forkJoin, Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DiamondLoaderComponent } from './diamond-loader/diamond-loader.component';
import { DataCollectionProgress, CountData } from 'src/app/shared/models/diamonds';  
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule, DiamondLoaderComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit, OnDestroy {
  private guid!: string;
  private contactId!: number;
   private mailCountInterval: any;
  private totalMailsSubscription?: Subscription;
  private diamondsCountSubscription?: Subscription;

  protected microsoftState: number = 1; // 1: not linked, 2: linking, 3: linked
  protected googleState: number = 1;
   protected counts: CountData = {
    mailCount: 0,
    contactCount: 0,
    organizationCount: 0,
    shoppingCentersCount: 0,
    placeCount: 0,
  };
   protected microsoftDataProgress: DataCollectionProgress = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  };
  protected googleDataProgress: DataCollectionProgress = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  };

  protected MICROSOFT_CONNECT_LINK = '';
  protected GOOGLE_CONNECT_LINK = '';

  protected ContactFolders: any;
  protected ContactInfos: any;

  emailsList: { email: string; isAdded: boolean }[] = [];
  domainList: { domain: string; isAdded: boolean }[] = [];

  protected googleContactFolders: {
    id: any;
    name: string;
    isChecked: boolean;
  }[] = [];
  protected googleContactInfos: any;

  googleEmailsList: { email: string; isAdded: boolean }[] = [];
  googleDomainList: { domain: string; isAdded: boolean }[] = [];

   totalProgressedMessage: any;
  constructor(
    private genericApiService: PlacesService,
    private http: HttpClient,
    private modalService: NgbModal,
   ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.getDiamondsCount();
    }, 2000);
    const guid = localStorage.getItem('guid');
    const contactId = localStorage.getItem('contactId');
    if (guid) this.guid = guid;
    if (contactId) this.contactId = +contactId;

    this.checkOwnerData();
    this.startMailCountInterval();
  }

  ngOnDestroy(): void {
     this.totalMailsSubscription?.unsubscribe();
    this.diamondsCountSubscription?.unsubscribe();
    this.clearMailCountInterval();
  }

  private getOwnerData(guid: string): Observable<any> {
    const contactRequestBody = {
      Name: 'GetContactDataFromGUID',
      Params: {
        GUIDSignature: guid,
      },
    };

    return this.genericApiService.BetaGenericAPI(contactRequestBody);
  }

  private async checkOwnerData(): Promise<void> {
    if (!this.guid) return;

    const response = await firstValueFrom(this.getOwnerData(this.guid.trim()));
    if (response.json && response.json.length) {
      const googleAccessToken = response.json[0].googleAccessToken;
      const microsoftAccessToken = response.json[0].microsoftAccessToken;

      // if(googleAccessToken||microsoftAccessToken){
      //   this.router.navigate(['/campaigns'])
      // }

      if (googleAccessToken) {
        this.googleState = 3;
        this.GoogleGetContactFolders();
      }

      if (microsoftAccessToken) {
        this.microsoftState = 3;
        this.GetContactFolders();
      }

      if (response.json[0].id) {
        this.MICROSOFT_CONNECT_LINK = `${environment.API_URL}/auth/signin?ContactId=${response.json[0].id}`;
        this.GOOGLE_CONNECT_LINK = `${environment.API_URL}/GoogleAuth/signin?ContactId=${response.json[0].id}`;
      }

      // Update intervals based on linked services
      this.updateIntervals();
    }
  }

  protected openConfigurationsModal(content: TemplateRef<any>): void {
    this.modalService.open(content, { size: 'lg' });
  }

  protected AcceptToReadReplyEmails(canRead: any): void {
    try {
      const body: any = {
        Name: 'AcceptToReadReplyEmails',
        Params: {
          ContactId: this.contactId,
          CanRead: canRead.target.checked,
        },
      };

      this.genericApiService.GenericAPI(body).subscribe({
        next: (data: any) => {},
      });
    } catch (error) {}
  }

  GetContactFolders() {
    this.http
      .get<any>(
        `${environment.API_URL}/MicrosoftMails/GetContactFolders?ContactId=${this.contactId}`
      )
      .subscribe({
        next: (data: any) => {
          this.ContactFolders = data;
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

  GetContactInfos() {
    this.http
      .get<any>(
        `${environment.api}/MicrosoftMails/GetContactInfos?ContactId=${this.contactId}`
      )
      .subscribe({
        next: (data: any) => {
          this.ContactInfos = data;
          this.mergeContactFoldersWithInfos();
        },
      });
  }

  AddFolderToBeRead(id: any, displayName: any, IsAdded: any) {
    const payload = {
      ContactId: this.contactId,
      FolderId: id,
      FolderName: displayName,
      IsAdded: IsAdded.target.checked,
    };
    this.http
      .post<any>(
        `${environment.api}/MicrosoftMails/AddFolderToBeRead`,
        payload
      )
      .subscribe(() => {});
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  AddEmailsToBeRead(emailInput: HTMLInputElement) {
    const email = emailInput.value.trim();

    if (this.validateEmail(email)) {
      const payload = {
        ContactId: this.contactId,
        Email: email,
        IsAdded: true,
      };

      this.http
        .post<any>(
          `${environment.api}/MicrosoftMails/AddEmailsToBeRead`,
          payload
        )
        .subscribe(() => {
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

    this.http
      .post<any>(
        `${environment.API_URL}/MicrosoftMails/AddEmailsToBeRead`,
        payload
      )
      .subscribe(() => {
        this.emailsList = this.emailsList.filter(
          (item) => item.email !== email
        );
      });
  }

  AddDomainToBeRead(domainInput: HTMLInputElement) {
    const domain = domainInput.value.trim();

    const payload = {
      ContactId: this.contactId,
      Domain: domain,
      IsAdded: true,
    };

    this.http
      .post<any>(
        `${environment.api}/MicrosoftMails/AddDomainToBeRead`,
        payload
      )
      .subscribe(() => {
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

    this.http
      .post<any>(
        `${environment.API_URL}/MicrosoftMails/AddDomainToBeRead`,
        payload
      )
      .subscribe(() => {
        this.domainList = this.domainList.filter(
          (item) => item.domain !== domain
        );
      });
  }

  //
  //
  //

  // protected GoogleAcceptToReadReplyEmails(canRead: any): void {
  //   try {
  //     this.spinner.show();
  //     const body: any = {
  //       Name: 'AcceptToReadReplyEmails',
  //       Params: {
  //         ContactId: this.contactId,
  //         CanRead: canRead.target.checked,
  //       },
  //     };

  //     this.genericApiService.genericApi(body).subscribe({
  //       next: (data: any) => {
  //         this.spinner.hide();
  //       },
  //     });
  //   } catch (error) {}
  // }

  GoogleGetContactFolders() {
    this.http
      .get<any>(
        `${environment.API_URL}/GoogleMails/GetUserGmailFolder?ContactId=${this.contactId}`
      )
      .subscribe({
        next: (data: any) => {
          this.googleContactFolders = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            isChecked: false,
          }));
          this.GoogleGetSavedData();
          // this.GooglemergeContactFoldersWithInfos();
        },
      });
  }

  // GooglemergeContactFoldersWithInfos() {
  //   if (this.googleContactFolders && this.googleContactInfos) {
  //     this.googleContactFolders.forEach((folder: any) => {
  //       const contactInfo =
  //         this.googleContactInfos.readEmailsWithFolderName.find(
  //           (info: any) => info.folderId === folder.id
  //         );
  //       if (contactInfo) {
  //         folder.isChecked = true;
  //       } else {
  //         folder.isChecked = false;
  //       }
  //     });

  //     this.googleEmailsList = [...this.googleContactInfos.readEmailsWithFroms];
  //     this.googleDomainList = [
  //       ...this.googleContactInfos.readEmailsWithDomains,
  //     ];
  //   }
  // }

  // GoogleGetContactInfos() {
  //   this.http
  //     .get<any>(
  //       `${environment.API_URL}/MicrosoftMails/GetContactInfos?ContactId=${this.contactId}`
  //     )
  //     .subscribe({
  //       next: (data: any) => {
  //         this.googleContactInfos = data;
  //         this.GooglemergeContactFoldersWithInfos();
  //       },
  //     });
  // }

  GoogleAddFolderToBeRead(id: any, displayName: any, IsAdded: any) {
    const body = {
      Name: 'ReadFromSpecificFolderInGoogle',
      Params: {
        IsLinkedWithGoogle: IsAdded.target.checked ? 1 : 0,
        FolderName: displayName,
        FolderId: id,
        GUIDSignature: this.guid,
      },
    };
    this.genericApiService.GenericAPI(body).subscribe((response) => {});
  }

  GoogleAddEmailsToBeRead(
    bool: number,
    emailInput?: HTMLInputElement,
    stringEmail?: string
  ) {
    const email = emailInput ? emailInput.value.trim() : stringEmail;

    if (this.validateEmail(email!)) {
      const body = {
        Name: 'ReadFromSpecificMailInGoogle',
        Params: {
          IsLinkedWithGoogle: bool,
          Email: email,
          GUIDSignature: this.guid,
        },
      };
      this.genericApiService.GenericAPI(body).subscribe((response) => {
        if (bool) {
          this.googleEmailsList.push({ email: email!, isAdded: true });
          emailInput!.value = '';
        } else {
          this.googleEmailsList = this.googleEmailsList.filter(
            (item) => item.email !== email
          );
        }
      });
    } else {
      alert('Please enter a valid email address!');
    }
  }

  GoogleAddDomainToBeRead(
    bool: number,
    domainInput?: HTMLInputElement,
    stringDomain?: string
  ) {
    const domain = domainInput ? domainInput.value.trim() : stringDomain;

    const body = {
      Name: 'ReadFromSpecificDomainInGoogle',
      Params: {
        IsLinkedWithGoogle: bool,
        Domain: domain,
        GUIDSignature: this.guid,
      },
    };
    this.genericApiService.GenericAPI(body).subscribe((response) => {
      if (bool) {
        this.googleDomainList.push({ domain: domain!, isAdded: true });
        domainInput!.value = '';
      } else {
        this.googleDomainList = this.googleDomainList.filter(
          (item) => item.domain !== domain
        );
      }
    });
  }

  GoogleGetDBFolders(): Observable<any> {
    const body = {
      Name: 'GetUserFolderAddedInGoogle',
      Params: {
        GUIDSignature: this.guid,
      },
    };
    return this.genericApiService.GenericAPI(body);
  }
  GoogleGetDBEmails(): Observable<any> {
    const body = {
      Name: 'GetUserFromsAddedInGoogle',
      Params: {
        GUIDSignature: this.guid,
      },
    };
    return this.genericApiService.GenericAPI(body);
  }
  GoogleGetDBDomains(): Observable<any> {
    const body = {
      Name: 'GetUserDomainsInGoogle',
      Params: {
        GUIDSignature: this.guid,
      },
    };
    return this.genericApiService.GenericAPI(body);
  }
  UnlinkGoogle(event: any): void {
    event.preventDefault();

    const body = {
      Name: 'UnlinkGoogle',
      Params: {
        GUIDSignature: this.guid,
      },
    };
    this.genericApiService.GenericAPI(body).subscribe((response) => {
      this.genericApiService.BetaGenericAPI(body).subscribe();
      this.googleState = 1;
      this.googleContactFolders = [];
      this.googleDomainList = [];
      this.googleEmailsList = [];
      this.updateIntervals();
    });
  }

  GoogleGetSavedData() {
    forkJoin({
      folders: this.GoogleGetDBFolders(),
      emails: this.GoogleGetDBEmails(),
      domains: this.GoogleGetDBDomains(),
    }).subscribe((result) => {
      if (result.folders.json.length) {
        this.googleContactFolders.forEach((f) => (f.isChecked = false));
        for (let f of result.folders.json) {
          const folder = this.googleContactFolders.find(
            (folder) => folder.id == f.folderId
          );
          if (folder) {
            folder.isChecked = true;
          }
        }
      }

      if (result.emails.json.length) {
        this.googleEmailsList = [
          ...result.emails.json.map((e: any) => ({
            email: e.email,
            isAdded: true,
          })),
        ];
      }

      if (result.domains.json.length) {
        this.googleDomainList = [
          ...result.domains.json.map((d: any) => ({
            domain: d.domain,
            isAdded: true,
          })),
        ];
      }
    });
  }

  getDiamondsCount(): void {
    const body = {
      Name: 'GetGemsCount',
      Params: {},
    };

    this.diamondsCountSubscription = this.genericApiService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          const data = response.json[0];
          this.counts = {
            mailCount: data.mailCount || 0,
            contactCount: data.contactCount || 0,
            organizationCount: data.organizationCount || 0,
            shoppingCentersCount: data.shoppingCentersCount || 0,
            placeCount: data.placeCount || 0,
          };
        }
      },
      error: (error) => {
      },
    });
  }
  getTotalMailsCount(): void {
    const body = {
      Name: 'TotalMails',
      Params: {},
    };
    this.totalMailsSubscription = this.genericApiService.GenericAPI(body).subscribe({
      next: (response) => {
        this.totalProgressedMessage = response.json[0]?.totalProgressedMessage;
      },
      complete: () => {},
    });
  }

  private startMailCountInterval() {
    // Update mail count and diamonds count every 5 seconds
    this.mailCountInterval = setInterval(() => {
      this.getDiamondsCount(); // Get updated mail count
      this.getTotalMailsCount(); // Get updated progress
    }, 5000);
  }

  private clearMailCountInterval() {
    if (this.mailCountInterval) {
      clearInterval(this.mailCountInterval);
      this.mailCountInterval = null;
    }
  }

  protected isAnyServiceLinked(): boolean {
    return this.microsoftState === 3 || this.googleState === 3;
  }

  private updateIntervals() {
    // Clear existing interval
    this.clearMailCountInterval();

    // Only start new interval if at least one service is linked
    if (this.isAnyServiceLinked()) {
      this.startMailCountInterval();
      // Initial fetch
      this.getDiamondsCount();
      this.getTotalMailsCount();
    } else {
      // Reset counts when no services are linked
      this.counts = {
        mailCount: 0,
        contactCount: 0,
        organizationCount: 0,
        shoppingCentersCount: 0,
        placeCount: 0,
      };
      this.totalProgressedMessage = 0;
    }
  }
}
