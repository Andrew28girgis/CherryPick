import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {
  Center,
  ManagerOrganization,
} from 'src/app/shared/models/shoppingCenters';
import { IChooseBroker } from '../../models/ichoose-broker';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  GenerateContextDTO,
  GetContactManagerDTO,
  GetManagerOrgDTO,
} from 'src/app/shared/models/GenerateContext';
import {
  concatMap,
  firstValueFrom,
  forkJoin,
  from,
  Observable,
  of,
  tap,
} from 'rxjs';
import { IEmailContent } from '../../models/iemail-content';
import { IManagedByBroker } from '../../models/imanaged-by-broker';
import { ICenterData } from '../../models/icenter-data';
import { MailContextGenerated } from 'src/app/shared/models/MailContextGenerated';

@Component({
  selector: 'app-new-contact-broker',
  templateUrl: './new-contact-broker.component.html',
  styleUrl: './new-contact-broker.component.css',
})
export class NewContactBrokerComponent implements OnInit, OnChanges {
  protected selectedContacts: Map<number, ManagerOrganization> = new Map<
    number,
    ManagerOrganization
  >();
  protected sendAsTo: boolean = false;
  protected sendAsCC: boolean = true;
  @Input() contacts!: ManagerOrganization[];
  showMinBuildingSize: boolean = true;
  showBuyBoxDescriptionDetails: boolean = true;
  showBuyBoxDescription: boolean = true;
  showRelationNames: boolean = true;
  ShowCompetitors: boolean = true;
  ShowComplementaries: boolean = true;
  showMoreRelations: { [key: number]: boolean } = {};
  showOrganizationManagers: boolean = true;
  showMangerDescriptionDetails: boolean = true;
  selectedPromptId: string = '';
  prompts: any[] = [];
  selectedPromptText: string = '';
  ResponseContextEmail: any[] = [];
  contactId!: any;
  BatchGuid!: string;
  ManagerOrgDTO!: GetManagerOrgDTO[];
  isLandingSelected: boolean = true;
  returnGetMailContextGenerated: MailContextGenerated[] = [];
  mailContextId!: number;
  selectedmail: IEmailContent | null = null;
  @ViewChildren('bodyDiv') bodyDivs!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('subjectDiv') subjectDivs!: QueryList<
    ElementRef<HTMLDivElement>
  >;
  protected emails!: IEmailContent[];
  protected dataLoaded: boolean = true;
  @Input() center!: Center;
  chooseBrokerObject!: IChooseBroker;
  managedByBrokerArray: IManagedByBroker[] = [];
  @Output() onStepDone = new EventEmitter<void>();
  @Output() scrollDown = new EventEmitter<void>();
  CCEmail: any;
  contactSignature: string = '';
  constructor(
    private placeService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    this.getCCEmail();
    this.contactId = localStorage.getItem('contactId');

    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
    this.GetContactSignature();
  }

  GetContactSignature(): void {
    this.spinner.show();
    const body = {
      Name: 'GetContactSignature',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      this.contactSignature = response.json[0].signature;
      this.spinner.hide();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.contacts.forEach((contact) =>
      this.selectedContacts.set(contact.ContactId, contact)
    );
    this.chooseBrokerObject = this.getChooseBrokerObject();
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
    this.chooseBrokerObject = this.getChooseBrokerObject();
  }

  getContactsByOrgID(): void {
    this.spinner.show();
    const body = {
      Name: 'GetAllContactsByOrganizationId',
      Params: {
        OrganizationId: this.contacts[0].ID,
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

  getChooseBrokerObject(): any {
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
    return object;
  }

  updatePrompt() {
    const selectedPrompt = this.prompts.find(
      (prompt) => prompt.id == this.selectedPromptId
    );
    if (selectedPrompt) {
      this.selectedPromptText =
        selectedPrompt.promptText || 'No prompt text available';
    } else {
      this.selectedPromptText = 'No prompt text available';
    }
  }

  async GetPrompts() {
    try {
      // Show the spinner while fetching data

      // Fetch category ID based on 'Availability'
      const categoryBody = {
        name: 'GetPromptsCategoryId',
        params: { Name: 'Availability' },
      };
      const catResponse = await firstValueFrom(
        this.placeService.BetaGenericAPI(categoryBody)
      );
      const categoryId = catResponse?.json?.[0]?.Id;

      // If categoryId doesn't exist, exit early
      if (!categoryId) {
        console.error('Category ID not found.');
        return;
      }

      // Fetch prompts based on categoryId
      const promptsBody = {
        name: 'GetPrompts',
        MainEntity: null,
        params: { Id: categoryId },
        Json: null,
      };
      const promptsResponse = await firstValueFrom(
        this.placeService.BetaGenericAPI(promptsBody)
      );
      const promptsData = promptsResponse?.json || [];

      // Process prompts data and set to prompts array
      this.prompts = promptsData.map((prompt: any) => ({
        id: prompt?.Id || null,
        name: prompt?.Name || 'Unnamed Prompt',
        promptText: prompt?.PromptText || 'No prompt text available',
      }));


      // Select the first prompt as default, if available
      if (this.prompts.length > 0) {
        this.selectedPromptId = this.prompts[0].id;
      } else {
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  }

  async PutMailsDraft(): Promise<void> {
    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }
    this.emails = [];
    this.dataLoaded = false;

    // this.spinner.show();
    await this.PutGenerateContext();

    const promptId = Number(this.selectedPromptId);
    // const IsCC = this.isISCcSelected;

    from(this.ResponseContextEmail)
      .pipe(
        concatMap((responseContextEmail) => {
          const body: any = {
            Name: 'PutMailsDraft',
            MainEntity: null,
            Params: {
              // BuyBoxId: this.buyBoxId,
              ContactId: this.contactId,
              PromptId: promptId,
              IsCC: this.chooseBrokerObject.sendAsCC,
              OrganizationId: Number(responseContextEmail.organizationId),
              context: `${responseContextEmail.context}`,
              BatchGuid: this.BatchGuid,
              CampaignId: this.center.CampaignId,
            },
            Json: null,
          };

          return new Promise<void>((resolve, reject) => {
            this.placeService.GenericAPI(body).subscribe({
              next: (data) => {
                if (data.json.length > 0 && data.json[0].id) {
                  const x = data.json;

                  this.mailContextId = x[0].id;

                  this.AddMailContextReceivers(
                    x[0].id,
                    x[0].organizationId
                  ).subscribe({
                    next: () => {},
                    error: () => {},
                    complete: () => {
                      resolve();
                    },
                  });
                } else {
                  this.dataLoaded = true;
                  // this.spinner.hide();
                }
              },
              error: (err) => {
                reject(err);
              },
            });
          });
        })
      )
      .subscribe({
        complete: async () => {
          // await this.getGeneratedEmails();
          this.checkMailGenerated();
          // this.scrollDown.emit();
          // this.onSubmit();
        },
      });
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

  mapToGetManagerOrgDTOs(
    chooseBrokerObject: IChooseBroker,
    managedByBrokerArray: IManagedByBroker[]
  ): GetManagerOrgDTO[] {
    const orgMap = new Map<number, GetContactManagerDTO[]>();

    chooseBrokerObject.selectedContacts.forEach((contact) => {
      const matchingBroker = managedByBrokerArray.find(
        (b) => b.contactId === contact.ContactId
      );
      let centers: ICenterData[] = matchingBroker?.centers || [];

      centers.push({ Id: this.center.Id, CenterName: this.center.CenterName });

      const contactDTO: GetContactManagerDTO = {
        ContactId: contact.ContactId,
        ContactName: `${contact.Firstname} ${contact.LastName}`,
        ShoppingCentersName: centers.map((c) => c.CenterName),
        ShoppingCentersID: centers.map((c) => c.Id.toString()),
      };

      if (!orgMap.has(contact.ID)) {
        orgMap.set(contact.ID, []);
      }

      orgMap.get(contact.ID)?.push(contactDTO);
    });

    const result: GetManagerOrgDTO[] = [];
    orgMap.forEach((contacts, orgId) => {
      result.push({
        OrganizationId: orgId,
        GetContactManagers: contacts,
      });
    });

    return result;
  }

  async PutGenerateContext(): Promise<void> {
    this.ResponseContextEmail = [];
    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    this.ManagerOrgDTO = [];
    this.ManagerOrgDTO = this.mapToGetManagerOrgDTOs(
      this.chooseBrokerObject,
      this.managedByBrokerArray
    );
    // debugger
    const requests = this.ManagerOrgDTO.map(async (managerOrg) => {
      const body: GenerateContextDTO = {
        ContactId: this.contactId,
        // BuyBoxId: this.buyBoxId,
        CampaignId: this.center.CampaignId!,
        AddMinMaxSize: this.showMinBuildingSize,
        AddCompetitors: this.ShowCompetitors,
        AddComplementaries: this.ShowComplementaries,
        AddBuyBoxManageOrgDesc: this.showMangerDescriptionDetails,
        AddSpecificBuyBoxDesc: this.showBuyBoxDescriptionDetails,
        AddBuyBoxDesc: this.showBuyBoxDescription,
        AddLandLordPage: this.isLandingSelected,
        IsCC: this.chooseBrokerObject.sendAsCC,
        GetContactManagers: managerOrg.GetContactManagers,
        OrganizationId: managerOrg.OrganizationId,
      };

      try {
        const response = await this.placeService
          .GenerateContext(body)
          .toPromise();
        this.ResponseContextEmail.push(response);
        return response;
      } catch (error) {
        console.error('Error executing API call for', body, ':', error);
        throw error;
      }
    });

    await Promise.all(requests);
  }

  AddMailContextReceivers(Mid: number, OrgID: number): Observable<any> {
    // const org = this.ManagerOrgDTO.find(
    //   (org: any) => org.OrganizationId === OrgID
    // );

    // if (
    //   !org ||
    //   !org.GetContactManagers ||
    //   org.GetContactManagers.length === 0
    // ) {
    //   return of(null);
    // }

    // this.spinner.show();

    const selectedContacts: ManagerOrganization[] = Array.from(
      this.selectedContacts.values()
    );

    const observables = selectedContacts.map((manager: any) => {
      // const ContactSCIds = manager.ShoppingCentersID.join(',');

      const body: any = {
        Name: 'AddMailContextReceivers',
        MainEntity: null,
        Params: {
          MailContextId: Mid,
          ContactId: manager.ContactId,
          ShoppingCenterIds: `${this.center.Id}`,
        },
        Json: null,
      };

      return this.placeService.GenericAPI(body);
    });

    return forkJoin(observables).pipe(
      tap(() => {
        // this.spinner.hide();
      })
    );
  }

  // async getGeneratedEmails() {
  //   var body: any = {
  //     Name: 'GetMailContextGenerated',
  //     MainEntity: null,
  //     Params: {
  //       campaignId: this.center.CampaignId,
  //       ContactId: this.contactId,
  //     },
  //     Json: null,
  //   };

  //   const data = await firstValueFrom(this.placeService.GenericAPI(body));

  //   if (data.json) {
  //     this.returnGetMailContextGenerated = data.json;
  //   }
  // }

  updateMailBody(event: Event, index: number) {
    const div = event.target as HTMLDivElement;
    this.emails[index].Body = div.innerHTML;
  }

  updateMailSubject(event: Event, index: number) {
    const div = event.target as HTMLDivElement;
    this.emails[index].Subject = div.innerText;
  }

  readSpecificMails(): void {
    const body = {
      Name: 'ReadSpecificMails',
      Params: {
        MailContextId: this.mailContextId,
        IsSent: 0,
      },
    };
    this.placeService.GenericAPI(body).subscribe((response: any) => {
      if (response.json && response.json.length > 0) {
        this.dataLoaded = true;
        // this.spinner.hide();

        this.dataLoaded = true;
        this.emails = response.json;
        this.emails.forEach((email) => {
          email.isEditing = false;
        });

        const interval = setInterval(() => {
          if (this.bodyDivs && this.subjectDivs) {
            this.bodyDivs.forEach((divRef: any, index: any) => {
              const html = this.emails[index].Body;
              divRef.nativeElement.innerHTML = html;
            });
            this.subjectDivs.forEach((divRef: any, index: any) => {
              const text = this.emails[index].Subject;
              divRef.nativeElement.innerText = text;
            });
            this.scrollDown.emit();
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }

  checkMailGenerated(): void {
    const body = {
      Name: 'CheckMailGenerated',
      Params: {
        MailContextId: this.mailContextId,
      },
    };
    this.placeService.GenericAPI(body).subscribe((response: any) => {
      if (response.json && response.json.length > 0) {
        const data: {
          isGenerated: boolean;
          errorMessage: string | null;
        } = response.json[0];
        if (data.errorMessage) {
          this.dataLoaded = true;
          alert(
            'Email generation is taking longer than expected. Please close this window and check your drafts folder in Emily later.'
          );
          this.onStepDone.emit();
          this.dataLoaded = true;
          // this.spinner.hide();

          return;
        } else if (data.isGenerated) {
          this.readSpecificMails();
          return;
        }
        setTimeout(async () => {
          this.checkMailGenerated();
        }, 3000);
      }
    });
  }

  getCCEmail() {
    const body: any = {
      Name: 'GetCCEmail',
      MainEntity: null,
      Params: {},
      Json: null,
    };
    this.placeService.GenericAPI(body).subscribe((res) => {
      const CEmail = res.json[0].virtualEmail;
      this.CCEmail = CEmail;
      this.GetPrompts().then(() => {
        this.spinner.hide();
      });
    });
  }

  sendEmail(email: IEmailContent): void {
    // Only proceed if direction is equal to 4
    if (email.Direction !== 4) {
      return;
    }

    this.spinner.show();

    const body: any = {
      Name: 'UpdateEmailData',
      MainEntity: null,
      Params: {
        MailId: email.MailId,
        Subject: email.Subject,
        Body: email.Body,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showToast('Email sent successfully');
        this.emails = this.emails.filter((e) => e.MailId !== email.MailId);
        if (this.emails.length === 0) {
          this.onStepDone.emit();
        }
      },
    });
  }

  openSendMailsModal(content: any, email: IEmailContent): void {
    this.selectedmail = email;
    this.modalService.open(content, {
      centered: true,
      windowClass: 'send-mail-content',
    });
  }

  getStringCC(): string {
    return (
      this.selectedmail?.O.map((o, oIndex) => {
        if (oIndex === 0) {
          return o.C.slice(1)
            .map((c) => c.Email)
            .join(',');
        } else {
          return o.C.map((c) => c.Email).join(',');
        }
      }).join(',') || ''
    );
  }

  encodeBody(body: any): string {
    return encodeURIComponent(body)
      .replace(/%20/g, ' ') // Spaces are encoded as '%20' by default
      .replace(/\+/g, '%20'); // Replace '+' with '%20'
  }

  generateMailtoLink(): any {
    const toEmails = `${
      this.selectedmail?.O![0].C[0].Email
    },${this.getStringCC()},${this.CCEmail}`;
    const subject = encodeURIComponent(this.selectedmail?.Subject || '');
    const body = this.encodeBody(this.selectedmail?.Body || '');
    const target = `https://outlook.office.com/mail/deeplink/compose?to=${toEmails}&subject=${subject}&body=${body}`;

    const redirectURL = new URL('https://outlook.office.com/owa/?state=1');
    redirectURL.searchParams.set(
      'redirectTo',
      btoa(target).replaceAll('=', '')
    );
    return redirectURL;
  }

  onSignatureChange(event: any): void {
    this.spinner.show();

    const body: any = {
      Name: 'UpdateContactSignature',
      MainEntity: null,
      Params: {
        Signature: event.target.value,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        // this.showToast('Email sent successfully');
        // this.emails = this.emails.filter((e) => e.MailId !== email.MailId);
        // if (this.emails.length === 0) {
        //   this.onStepDone.emit();
        // }
      },
    });
  }
}
