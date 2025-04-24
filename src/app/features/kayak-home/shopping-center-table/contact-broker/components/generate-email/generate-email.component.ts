import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { IBuyboxDetails } from '../../models/ibuybox-details';
import { Generated, RelationNames } from 'src/app/shared/models/emailGenerate';
import { NgxSpinnerService } from 'ngx-spinner';
import {
  concatMap,
  firstValueFrom,
  forkJoin,
  from,
  Observable,
  of,
  tap,
} from 'rxjs';
import {
  GenerateContextDTO,
  GetContactManagerDTO,
  GetManagerOrgDTO,
} from 'src/app/shared/models/GenerateContext';
import { MailContextGenerated } from 'src/app/shared/models/MailContextGenerated';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { IChooseBroker } from '../../models/ichoose-broker';
import { IManagedByBroker } from '../../models/imanaged-by-broker';
import { ICenterData } from '../../models/icenter-data';
import { IEmailContent } from '../../models/iemail-content';

@Component({
  selector: 'app-generate-email',
  templateUrl: './generate-email.component.html',
  styleUrl: './generate-email.component.css',
})
export class GenerateEmailComponent implements OnInit {
  buyboxDetails!: IBuyboxDetails;
  showMinBuildingSize: boolean = true;
  showBuyBoxDescriptionDetails: boolean = true;
  BuyBoxOrganizationName: string = '';
  showBuyBoxDescription: boolean = true;
  generated!: Generated[];
  showRelationNames: boolean = true;
  ShowCompetitors: boolean = true;
  ShowComplementaries: boolean = true;
  relationCategoriesNames: RelationNames[] = [];
  showMoreRelations: { [key: number]: boolean } = {};
  ManagerOrganizationName: string = '';
  showOrganizationManagers: boolean = true;
  showMangerDescriptionDetails: boolean = true;
  selectedPromptId: string = '';
  prompts: any[] = [];
  selectedPromptText: string = '';
  editablePromptText: string = '';
  isEditing: boolean = false;
  ResponseContextEmail: any[] = [];
  contactId!: any;
  BatchGuid!: string;
  emailTemplates: {
    organizationId: number;
    contacts?: any[];
    templateOne: string;
    templateTwo: string;
  }[] = [];
  emailBody: string = '';
  ManagerOrgDTO!: GetManagerOrgDTO[];
  isLandingSelected: boolean = true;
  returnGetMailContextGenerated: MailContextGenerated[] = [];
  mailContextId!: number;
  isAdvancedCollapsed = true;

  @ViewChildren('bodyDiv') bodyDivs!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('subjectDiv') subjectDivs!: QueryList<
    ElementRef<HTMLDivElement>
  >;

  protected emails!: IEmailContent[];
  protected dataLoaded: boolean = true;

  @Input() buyBoxId!: number;
  @Input() center!: Center;
  @Input() chooseBrokerObject!: IChooseBroker;
  @Input() managedByBrokerArray!: IManagedByBroker[];
  @Output() onStepDone = new EventEmitter<void>();

  constructor(
    private placeService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    this.contactId = localStorage.getItem('contactId');

    await this.GetBuyBoxDetails();
    await this.GetBuyBoxInfo();
    await this.GetRetailRelationCategories();
    await this.GetPrompts();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;

    this.spinner.hide();
  }

  async GetBuyBoxDetails() {
    const body = {
      Name: 'GetWizardBuyBoxesById',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    const response = await firstValueFrom(this.placeService.GenericAPI(body));
    if (response.json) {
      this.buyboxDetails = response.json;
    }
  }

  async GetBuyBoxInfo() {
    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    const data = await firstValueFrom(this.placeService.GenericAPI(body));
    this.generated = data.json || [];

    this.ManagerOrganizationName =
      this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationName;
    this.BuyBoxOrganizationName =
      this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.Name;

    const buyBox = this.generated?.[0]?.Buybox?.[0];
    if (buyBox) {
      this.ManagerOrganizationName =
        buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
          ?.ManagerOrganizationName || '';
      this.BuyBoxOrganizationName = buyBox.BuyBoxOrganization?.[0]?.Name || '';
    }

    // Extract Shopping Centers safely

    this.generated?.[0]?.Releations?.forEach((r) => {
      r.relationSelect = true;
    });
  }

  toggleRelationNames(event: any) {
    this.showRelationNames = event.target.checked;
    if (this.showRelationNames == true) {
      this.ShowCompetitors = true;
      this.ShowComplementaries = true;
    } else {
      this.ShowCompetitors = false;
      this.ShowComplementaries = false;
    }
  }

  getRelationsForCategory(categoryId: number) {
    if (
      !this.generated ||
      this.generated.length === 0 ||
      !this.generated[0].Releations
    ) {
      return [];
    }
    return this.generated[0].Releations.filter(
      (item) => item.RetailRelationCategoryId === categoryId
    );
  }

  getVisibleRelations(categoryId: number) {
    const relations = this.getRelationsForCategory(categoryId);
    return this.showMoreRelations[categoryId]
      ? relations
      : relations.slice(0, 3);
  }

  toggleShowMore(categoryId: number) {
    this.showMoreRelations[categoryId] = !this.showMoreRelations[categoryId];
  }

  toggleManagerDesc(event: any) {
    this.showOrganizationManagers = event.target.checked;
    if (this.showOrganizationManagers == true) {
      this.showMangerDescriptionDetails = true;
    } else {
      this.showMangerDescriptionDetails = false;
    }
  }

  async GetRetailRelationCategories() {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    const data = await firstValueFrom(this.placeService.GenericAPI(body));
    this.relationCategoriesNames = data.json;
    this.relationCategoriesNames?.forEach((r) => (r.selected = true));
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
    const categoryBody = {
      name: 'GetPromptsCategoryId',
      params: {
        Name: 'Availability',
      },
    };
    const catResponse = await firstValueFrom(
      this.placeService.GenericAPI(categoryBody)
    );
    const categoryId = catResponse?.json?.[0]?.Id;
    if (!categoryId) {
      return;
    }
    const promptsBody = {
      name: 'GetPrompts',
      MainEntity: null,
      params: {
        Id: categoryId,
      },
      Json: null,
    };
    const promptsResponse = await firstValueFrom(
      this.placeService.GenericAPI(promptsBody)
    );
    const promptsData = promptsResponse?.json || [];
    if (promptsData.length > 0) {
      this.prompts = promptsData.map((prompt: any) => ({
        id: prompt?.Id || null,
        name: prompt?.Name || 'Unnamed Prompt',
        promptText: prompt?.PromptText || 'No prompt text available',
      }));
      // Set the first prompt as selected by default
      this.selectedPromptId = this.prompts[0].id;
    } else {
      this.prompts = [];
      this.selectedPromptId = '';
    }
  }

  savePrompt(modal: any) {
    if (!this.selectedPromptId) {
      this.showToast('No prompt selected to update.');
      return;
    }
    if (!this.editablePromptText.trim()) {
      this.showToast('Prompt text cannot be empty.');
      return;
    }

    const body = {
      name: 'EditEmailPrompt',
      params: {
        PromptText: this.editablePromptText,
        PromptId: Number(this.selectedPromptId),
      },
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.selectedPromptText = this.editablePromptText;
        this.isEditing = false;
        modal.close();
      },
    });
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
              BuyBoxId: this.buyBoxId,
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
          await this.getGeneratedEmails();
          this.checkMailGenerated();
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

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
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
    const requests = this.ManagerOrgDTO.map(async (managerOrg) => {
      const body: GenerateContextDTO = {
        ContactId: this.contactId,
        BuyBoxId: this.buyBoxId,
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
    const org = this.ManagerOrgDTO.find(
      (org: any) => org.OrganizationId === OrgID
    );

    if (
      !org ||
      !org.GetContactManagers ||
      org.GetContactManagers.length === 0
    ) {
      return of(null);
    }

    // this.spinner.show();

    const observables = org.GetContactManagers.map((manager: any) => {
      const ContactSCIds = manager.ShoppingCentersID.join(',');

      const body: any = {
        Name: 'AddMailContextReceivers',
        MainEntity: null,
        Params: {
          MailContextId: Mid,
          ContactId: manager.ContactId,
          ShoppingCenterIds: ContactSCIds,
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

  async getGeneratedEmails() {
    var body: any = {
      Name: 'GetMailContextGenerated',
      MainEntity: null,
      Params: {
        campaignId: this.center.CampaignId,
        ContactId: this.contactId,
      },
      Json: null,
    };

    const data = await firstValueFrom(this.placeService.GenericAPI(body));

    if (data.json) {
      this.returnGetMailContextGenerated = data.json;
    }
  }

  openPromptTextModal(modal: any) {
    if (
      !this.selectedPromptText ||
      this.selectedPromptText === 'No prompt text available'
    ) {
      this.showToast('No prompt text available to display.');
      return;
    }
    this.modalService.open(modal, { size: 'lg', backdrop: true });
  }

  editPrompt() {
    this.isEditing = true;
    this.editablePromptText = this.selectedPromptText;
  }

  // onSubmit(): void {
  //   this.onStepDone.emit();
  // }

  updateMailBody(event: Event, index: number) {
    const div = event.target as HTMLDivElement;
    this.emails[index].body = div.innerHTML;
  }

  updateMailSubject(event: Event, index: number) {
    const div = event.target as HTMLDivElement;
    this.emails[index].subject = div.innerText;
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
            this.bodyDivs.forEach((divRef, index) => {
              const html = this.emails[index].body;
              divRef.nativeElement.innerHTML = html;
            });
            this.subjectDivs.forEach((divRef, index) => {
              const text = this.emails[index].subject;
              divRef.nativeElement.innerText = text;
            });
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
          // this.onStepDone.emit();
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

  sendEmail(email: IEmailContent): void {
    // Only proceed if direction is equal to 4
    if (email.direction !== 4) {
      console.log('Email not sent - direction is not 4:', email.mailId);
      return;
    }

    this.spinner.show();

    const body: any = {
      Name: 'UpdateEmailData',
      MainEntity: null,
      Params: {
        MailId: email.mailId,
        Subject: email.subject,
        Body: email.body,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showToast('Email sent successfully');
        this.emails = this.emails.filter((e) => e.mailId !== email.mailId);
        if (this.emails.length === 0) {
          this.onStepDone.emit();
        }
      },
    });
  }

  // Send all emails
  sendAllEmails(): void {
    // Filter emails to only include those with direction = 4
    const eligibleEmails = this.emails.filter((email) => email.direction === 4);
    // If no eligible emails, return early
    if (eligibleEmails.length === 0) {
      console.log('No eligible emails to send (direction = 4)');
      return;
    }

    // Create a counter to track when all emails are sent - use filtered length

    this.spinner.show();

    // Send each eligible email one by one - iterate through filtered array
    eligibleEmails.forEach((email) => {
      const body: any = {
        Name: 'UpdateEmailData',
        MainEntity: null,
        Params: {
          MailId: email.mailId,
          Subject: email.subject,
          Body: email.body,
        },
        Json: null,
      };
      this.placeService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast('Emails sent successfully');
          this.emails = this.emails.filter((e) => e.mailId !== email.mailId);
          if (this.emails.length === 0) {
            this.spinner.hide();
            this.onStepDone.emit();
          }
        },
      });
    });
  }
}
