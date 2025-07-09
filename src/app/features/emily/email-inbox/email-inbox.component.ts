import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { Generated } from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';
import { Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  OrganizationChecked,
  buyboxChecklist,
} from 'src/app/shared/models/sidenavbar';
import {
  GenerateContextDTO,
  GetContactManagerDTO,
  GetManagerOrgDTO,
} from 'src/app/shared/models/GenerateContext';
import { MailContextGenerated } from 'src/app/shared/models/MailContextGenerated';
import { EmilyService } from 'src/app/core/services/emily.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-email-inbox',
  templateUrl: './email-inbox.component.html',
  styleUrl: './email-inbox.component.css',
})
export class EmailInboxComponent implements OnInit {
  buyBoxId!: any;
  contactId!: any;
  BatchGuid!: string;
  campaignId: any;
  buyBoxIdGenerate: any;
  prompts: any[] = [];
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  isLandingSelected: boolean = true;
  isISCcSelected: boolean = true;
  showRelationNames: boolean = true;
  showOrganizationManagers: boolean = true;
  showMangerDescriptionDetails: boolean = true;
  showBuyBoxDescriptionDetails: boolean = true;
  showBuyBoxDescription: boolean = true;
  ShowCompetitors: boolean = true;
  ShowComplementaries: boolean = true;
  showMinBuildingSize: boolean = true;
  generated: Generated[] = [];
  relationCategoriesNames: RelationNames[] = [];
  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  ManagerOrgDTO!: GetManagerOrgDTO[];
  OrganizationCheckedServices: OrganizationChecked[] = [];
  showMoreRelations: { [key: number]: boolean } = {};
  returnGetMailContextGenerated: MailContextGenerated[] = [];
  returnGetMailContext!: any;
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  MangerDescription: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  selectedShoppingCenter: string = '';
  buyboxChecklist!: buyboxChecklist;
  buybox: any;
  isAdvancedVisible = false;

  emailBody: string = '';
  emailTemplates: {
    organizationId: number;
    contacts?: any[];
    templateOne: string;
    templateTwo: string;
  }[] = [];
  ResponseContextEmail: any;
  mailContextId!: number;

  @Input() buyBoxIdReply!: number;
  @Input() orgIdReply!: number;
  @Input() emailBodyReply!: any;
  @Input() selectedContactContactId!: any;
  @Input() selectedContactContextId!: any;
  @Input() modal: any;
  emailSubject: string = '';
  emailBodyResponse!: SafeHtml;
  isEditing = false; // Flag indicating if currently editing
  ContactManagerNameWithShoppingCenterData: any;
  contactFirstName: any;
  contactLastName: any;
  contactCenterName: any;
  contactCenterId: any;
  // New properties for email generation flow
  dataLoaded: boolean = true;
  isEmailGenerated: boolean = false;

  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private emilyService: EmilyService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
    console.log('selectedContactContactId', this.selectedContactContactId);
    console.log('selectedContactContextId', this.selectedContactContextId);

    this.route.paramMap.subscribe((params) => {
      this.campaignId = params.get('campaignId');
      this.buyBoxIdGenerate = params.get('buyBoxId');
    });

    this.emilyService
      .getCheckList()
      .subscribe((buyboxChecklist: buyboxChecklist) => {
        if (this.buyboxChecklist == null || this.buyboxChecklist == undefined) {
          const storedChecklist = sessionStorage.getItem('buyboxChecklist');
          if (storedChecklist) {
            this.buyboxChecklist = JSON.parse(
              storedChecklist
            ) as buyboxChecklist;
          }
        }
        this.buyBoxId = this.buyboxChecklist?.buyboxId[0];
        this.OrganizationCheckedServices = this.buyboxChecklist?.organizations;
      });

    const storedChecklist = sessionStorage.getItem('buyboxChecklist');
    if (storedChecklist) {
      const parsedChecklist = JSON.parse(storedChecklist) as buyboxChecklist;
      if (
        JSON.stringify(parsedChecklist) !== JSON.stringify(this.buyboxChecklist)
      ) {
        this.buyboxChecklist = parsedChecklist;
        this.buyBoxId = this.buyboxChecklist?.buyboxId[0];
        this.OrganizationCheckedServices = this.buyboxChecklist?.organizations;
      }
    }

    this.GetPrompts();
    this.GetBuyBoxInfo();
    this.GetBuyBoxInfoDetails();
    this.GetRetailRelationCategories();
    this.GetContactManagerNameWithShoppingCenterData();
  }

  GetPrompts() {
    const categoryBody = {
      name: 'GetPromptsCategoryId',
      params: {
        Name: 'Availability',
      },
    };
    this.PlacesService.GenericAPI(categoryBody).subscribe({
      next: (catResponse: any) => {
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
        this.PlacesService.GenericAPI(promptsBody).subscribe({
          next: (promptsResponse: any) => {
            const promptsData = promptsResponse?.json || [];
            if (promptsData.length > 0) {
              this.prompts = promptsData.map((prompt: any) => ({
                id: prompt?.Id || null,
                name: prompt?.Name || 'Unnamed Prompt',
                promptText: prompt?.PromptText || 'No prompt text available',
              }));
              this.selectedPromptId = this.prompts[0].id;
            } else {
              this.prompts = [];
              this.selectedPromptId = '';
            }
          },
        });
      },
    });
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

  GetBuyBoxInfo() {
    const body: any = {
      Name: 'GetBuyBoxInfo',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
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
          this.BuyBoxOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.Name || '';
        }

        this.generated?.[0]?.Releations?.forEach((r) => {
          r.relationSelect = true;
        });
      },
    });
  }

  GetBuyBoxInfoDetails() {
    const body: any = {
      Name: 'GetWizardBuyBoxesById',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.buybox = data.json;
      },
    });
  }

  GetRetailRelationCategories() {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.relationCategoriesNames = data.json;
        this.relationCategoriesNames?.forEach((r) => (r.selected = true));
      },
    });
  }

  toggleAdvanced() {
    this.isAdvancedVisible = !this.isAdvancedVisible;
  }

  toggleManagerDesc(event: any) {
    this.showOrganizationManagers = event.target.checked;
    if (this.showOrganizationManagers == true) {
      this.showMangerDescriptionDetails = true;
    } else {
      this.showMangerDescriptionDetails = false;
    }
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

  GetContactManagerNameWithShoppingCenterData() {
    const body: any = {
      Name: 'GetContactManagerNameWithShoppingCenterData',
      MainEntity: null,
      Params: {
        ContactId: this.selectedContactContactId,
        MailContextId: this.selectedContactContextId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ContactManagerNameWithShoppingCenterData = data.json || [];
        this.contactFirstName = this.ContactManagerNameWithShoppingCenterData?.[0]?.firstName || '';
        this.contactLastName = this.ContactManagerNameWithShoppingCenterData?.[0]?.lastName || '';
        this.contactCenterId = this.ContactManagerNameWithShoppingCenterData?.[0]?.id || '';
        this.contactCenterName =
          this.ContactManagerNameWithShoppingCenterData?.[0]?.centerName || '';
          console.log('contactFirstName', this.contactFirstName);
          console.log('contactLastName', this.contactLastName);
          console.log('contactCenterName', this.contactCenterName);
          console.log('contactCenterId', this.contactCenterId);
          
      },
    });
  }

  transformToDTO(data: any): GetContactManagerDTO {
    const center =
      data?.ShoppingCenters && data.ShoppingCenters?.length > 0
        ? data.ShoppingCenters[0]
        : null;
    return {
      ContactId: data?.ContactId,
      ContactName: `${data?.Firstname} ${data?.Lastname}`,
      ShoppingCentersName: center ? [center.CenterName.trim()] : [],
      ShoppingCentersID: center ? [center.id.toString()] : [],
    };
  }

  async GenerateContext(): Promise<void> {
    const trimQuotes = (str: string) => {
      if (typeof str !== 'string') return str;
      return str.replace(/^"+|"+$/g, '').trim();
    };

    const dto: GetContactManagerDTO = this.transformToDTO(
      this.selectedContactContactId
    );

    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    this.spinner.show();
    const body: GenerateContextDTO = {
      IsReply: true,
      OldMail: this.emailBodyReply,
      ContactId: this.contactId,
      BuyBoxId: this.buyBoxIdGenerate,
      CampaignId: this.campaignId,
      AddMinMaxSize: this.showMinBuildingSize,
      AddCompetitors: this.ShowCompetitors,
      AddComplementaries: this.ShowComplementaries,
      AddBuyBoxManageOrgDesc: this.showMangerDescriptionDetails,
      AddSpecificBuyBoxDesc: this.showBuyBoxDescriptionDetails,
      AddBuyBoxDesc: this.showBuyBoxDescription,
      AddLandLordPage: this.isLandingSelected,
      IsCC: this.isISCcSelected,
      GetContactManagers: [
        {
          ContactId: Number(this.selectedContactContactId),
          ContactName: trimQuotes(this.contactFirstName) + ' ' + trimQuotes(this.contactLastName),
          ShoppingCentersName: [this.contactCenterName],
        },
      ],
      OrganizationId: this.orgIdReply,
    };

    try {
      const data = await firstValueFrom(
        this.PlacesService.GenerateContext(body)
      );
      this.ResponseContextEmail = JSON.stringify(data.context, null, 2);
      this.spinner.hide();
    } catch (error) {
      console.error('Error in GenerateContext:', error);
    } finally {
      this.spinner.hide();
    }
  }

  async PutMailsDraft(): Promise<void> {
    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }
    // Reset email state
    this.emailBody = '';
    this.emailSubject = '';
    this.emailBodyResponse = this.sanitizer.bypassSecurityTrustHtml('');
    this.dataLoaded = false;
    this.isEmailGenerated = false;
    // First generate context
    await this.GenerateContext();

    // this.spinner.show();
    const promptId = Number(this.selectedPromptId);
    const IsCC = this.isISCcSelected;

    const body: any = {
      Name: 'PutMailsDraft',
      MainEntity: null,
      Params: {
        BuyBoxId: this.buyBoxIdGenerate,
        ContactId: this.contactId,
        PromptId: promptId,
        IsCC: IsCC,
        OrganizationId: Number(this.orgIdReply),
        context: `${this.ResponseContextEmail}`,
        BatchGuid: this.BatchGuid,
        CampaignId: this.campaignId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const x = data.json;
        if (x && x.length > 0 && x[0].id) {
          this.mailContextId = x[0].id;
          this.AddMailContextReceivers(x[0].id, x[0].organizationId).subscribe({
            next: () => {},
            error: () => {},
            complete: () => {
              // Start the email generation monitoring flow
              this.getGeneratedEmails();
              this.checkMailGenerated();
            },
          });
        } else {
          // this.spinner.hide();
          this.dataLoaded = true;
          this.showToast('Failed to create email draft.');
        }
      },
      error: (error) => {
        console.error('Error in PutMailsDraft:', error);
        // this.spinner.hide();
        this.dataLoaded = true;
        this.showToast('Error generating email draft.');
      },
    });
  }

  AddMailContextReceivers(Mid: number, OrgID: number): Observable<any> {
    // Assuming this.selectedContactContactId is a single contact object
    const manager = this.selectedContactContactId;
    // If ShoppingCenters is an array and you need to combine something, do so appropriately:
    const ContactSCIds = manager?.ShoppingCenters?.map(
      (sc: { id: any }) => sc.id
    ).join(',');

    // Ensure ShoppingCenterIds is always a comma-separated string (even if single or multiple IDs)
    let shoppingCenterIds = '';
    if (Array.isArray(this.contactCenterId)) {
      shoppingCenterIds = this.contactCenterId.join(',');
    } else if (typeof this.contactCenterId === 'string') {
      shoppingCenterIds = this.contactCenterId;
    } else if (typeof this.contactCenterId === 'number') {
      shoppingCenterIds = this.contactCenterId.toString();
    }

    const body: any = {
      Name: 'AddMailContextReceivers',
      MainEntity: null,
      Params: {
        MailContextId: Mid,
        ContactId: this.selectedContactContactId,
        ShoppingCenterIds: shoppingCenterIds, // Always comma-separated string
      },
      Json: null,
    };

    return this.PlacesService.GenericAPI(body).pipe(
      tap(() => {
        console.log('Mail context receivers added');
      })
    );
  }

  async getGeneratedEmails() {
    const body: any = {
      Name: 'GetMailContextGenerated',
      MainEntity: null,
      Params: {
        campaignId: this.campaignId,
        ContactId: this.selectedContactContactId,
      },
      Json: null,
    };

    try {
      const data = await firstValueFrom(this.PlacesService.GenericAPI(body));
      if (data.json) {
        this.returnGetMailContextGenerated = data.json;
        console.log('Generated emails fetched:', this.returnGetMailContextGenerated);
      }
    } catch (error) {
      console.error('Error fetching generated emails:', error);
    }
  }

  checkMailGenerated(): void {
    const body = {
      Name: 'CheckMailGenerated',
      Params: {
        MailContextId: this.mailContextId, // returned from api
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (response.json && response.json.length > 0) {
          const data: {
            isGenerated: boolean;
            errorMessage: string | null;
          } = response.json[0];

          if (data.errorMessage) {
            this.dataLoaded = true;
            this.spinner.hide();
            this.showToast(
              'Email generation is taking longer than expected. Please try again later.'
            );
            return;
          } else if (data.isGenerated) {
            // Email is ready, now read it
            this.ReadSpecificMails(this.mailContextId); // returned from api
            return;
          }

          // If not generated yet, check again after 3 seconds
          setTimeout(() => {
            this.checkMailGenerated();
          }, 3000);
        } else {
          // No response, try again
          setTimeout(() => {
            this.checkMailGenerated();
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error checking mail generation:', error);
        this.spinner.hide();
        this.dataLoaded = true;
        this.showToast('Error checking email generation status.');
      },
    });
  }

  ReadSpecificMails(mailContextId: number): void {
    const body: any = {
      Name: 'ReadSpecificMails',
      MainEntity: null,
      Params: {
        MailContextId: Number(mailContextId),
        IsSent: 0,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const response = data.json;
        if (!response || response.length === 0) {
          // Email not ready yet, try again after 3 seconds
          setTimeout(() => {
            this.ReadSpecificMails(mailContextId);
          }, 3000);
        } else {
          // Email is ready, handle the new response structure
          const mail = response[0];
          this.emailBody = mail.Body || mail.body || '';
          this.emailBodyResponse = this.sanitizer.bypassSecurityTrustHtml(this.emailBody);
          this.emailSubject = mail.Subject || mail.subject || '';
          // Optionally, handle organizations and contacts if needed:
          // this.organizations = mail.O || [];
          // Example: extract all emails from all organizations
          // const allEmails = (mail.O || []).flatMap(org => (org.C || []).map(c => c.Email));
          this.isEmailGenerated = true;
          this.dataLoaded = true;
          this.spinner.hide();
          console.log('Email generated successfully', mail);
        }
      },
      error: (error) => {
        console.error('Error reading specific mails:', error);
        this.spinner.hide();
        this.dataLoaded = true;
        this.showToast('Error reading generated email.');
      },
    });
  }

  onContentEditChange(event: Event) {
    const target = event.target as HTMLElement;
    // Mark as editing
    this.isEditing = true;
    // Store plain text or HTML as per your needs
    this.emailBody = target.innerHTML; // or innerText if needed
  }

  Send() {
    if (!this.isEmailGenerated) {
      this.showToast('Please generate an email first.');
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'ComposeEmail',
      MainEntity: null,
      Params: {
        BuyBoxId: +this.buyBoxId,
        CampaignId: +this.campaignId,
        RecieverId: [Number(this.selectedContactContactId.ContactId)].join(','),
        Subject: this.emailSubject,
        Body: this.emailBody,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.showToast('Email sent successfully!');
      },
      error: (error) => {
        console.error('Error sending email:', error);
        this.spinner.hide();
        this.showToast('Error sending email.');
      },
    });
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }
}