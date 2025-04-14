import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { Generated } from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';
import { from, Observable, of, forkJoin, firstValueFrom } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  returnGetMailContext!:any;
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

  @Input() buyBoxIdReply!: number;
  @Input() orgIdReply!: number;
  @Input() emailBodyReply!: any;
  @Input() selectedContactContactId!: any;
  @Input() modal: any;
  emailSubject: string = '';
  emailBodyResponse!: SafeHtml;

  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private emilyService: EmilyService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
    console.log('selectedContactContactId', this.selectedContactContactId);

    this.route.paramMap.subscribe((params) => {
      this.campaignId = params.get('campaignId');
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
              // Set the first prompt as selected by default
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

  transformToDTO(data: any): GetContactManagerDTO {
    const center =
      data.ShoppingCenters && data.ShoppingCenters.length > 0
        ? data.ShoppingCenters[0]
        : null;
    return {
      ContactId: data.ContactId,
      ContactName: `${data.Firstname} ${data.Lastname}`,
      ShoppingCentersName: center ? [center.CenterName.trim()] : [],
      ShoppingCentersID: center ? [center.id.toString()] : [],
    };
  }

  async GenerateContext(): Promise<void> {
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
      BuyBoxId: this.buyBoxId,
      CampaignId: this.campaignId,
      AddMinMaxSize: this.showMinBuildingSize,
      AddCompetitors: this.ShowCompetitors,
      AddComplementaries: this.ShowComplementaries,
      AddBuyBoxManageOrgDesc: this.showMangerDescriptionDetails,
      AddSpecificBuyBoxDesc: this.showBuyBoxDescriptionDetails,
      AddBuyBoxDesc: this.showBuyBoxDescription,
      AddLandLordPage: this.isLandingSelected,
      IsCC: this.isISCcSelected,
      GetContactManagers: [dto],
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
    await this.GenerateContext();

    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    this.spinner.show();
    const promptId = Number(this.selectedPromptId);
    const IsCC = this.isISCcSelected;

    const body: any = {
      Name: 'PutMailsDraft',
      MainEntity: null,
      Params: {
        BuyBoxId: this.buyBoxId,
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
        this.AddMailContextReceivers(x[0].id, x[0].organizationId).subscribe({
          next: () => {},
          error: () => {},
          complete: () => {
            this.ReadSpecificMails(x[0].id);
            this.spinner.hide();
          },
        });
      },
    });
  }

  AddMailContextReceivers(Mid: number, OrgID: number): Observable<any> {
    this.spinner.show();

    // Assuming this.selectedContactContactId is a single contact object
    const manager = this.selectedContactContactId;
    // If ShoppingCenters is an array and you need to combine something, do so appropriately:
    const ContactSCIds = manager.ShoppingCenters.map(
      (sc: { id: any }) => sc.id
    ).join(',');

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

    // You might not even need forkJoin if you're only calling one API
    return this.PlacesService.GenericAPI(body).pipe(
      tap(() => {
        this.spinner.hide();
      })
    );
  }

  getGeneratedEmails(mailContextId: number): void {
    this.spinner.show();
    var body: any = {
      Name: 'GetMailContextGenerated',
      MainEntity: null,
      Params: {
        campaignId: this.campaignId,
        ContactId: this.contactId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.returnGetMailContextGenerated = data.json;
        console.log(`before`, this.returnGetMailContextGenerated);

        this.returnGetMailContextGenerated =
          this.returnGetMailContextGenerated.filter((r: any) => {
            if (r.MailContextId == mailContextId) {
              this.emailBodyResponse = r.Body;
              this.emailSubject = r.Subject;
            }
          });
        console.log(`this.mailContextId`, mailContextId);
        console.log(
          `this.returnGetMailContextGenerated`,
          this.returnGetMailContextGenerated
        );
        console.log(`this.emailBodyResponse`, this.emailBodyResponse);
        console.log(`this.emailSubject`, this.emailSubject);

        this.spinner.hide();
      },
    });
  }
  ReadSpecificMails(mailContextId: number) {
    this.spinner.show();

    var body: any = {
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
        this.returnGetMailContextGenerated = data.json;
        console.log(`this.returnGetMailContextGenerated`, data.json);
        // Sanitize and apply HTML content to emailBody
        this.emailBodyResponse = this.sanitizer.bypassSecurityTrustHtml(this.returnGetMailContext[0].body);
        console.log(`this.returnGetMailContextGenerated`, this.returnGetMailContext[0].body);

        this.spinner.hide();
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
}
