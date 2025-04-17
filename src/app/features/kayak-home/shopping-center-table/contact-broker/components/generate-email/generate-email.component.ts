import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { IBuyboxDetails } from '../../models/ibuybox-details';
import { Generated, RelationNames } from 'src/app/shared/models/emailGenerate';
import { NgxSpinnerService } from 'ngx-spinner';
import { concatMap, forkJoin, from, Observable, of, tap } from 'rxjs';
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

  ngOnInit(): void {
    this.contactId = localStorage.getItem('contactId');

    this.GetBuyBoxDetails();
    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetPrompts();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
  }

  GetBuyBoxDetails() {
    const body = {
      Name: 'GetWizardBuyBoxesById',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (response.json) {
          this.buyboxDetails = response.json;
        }
      },
    });
  }

  GetBuyBoxInfo() {
    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    this.placeService.GenericAPI(body).subscribe({
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

        // Extract Shopping Centers safely

        this.generated?.[0]?.Releations?.forEach((r) => {
          r.relationSelect = true;
        });
      },
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

  GetRetailRelationCategories() {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    this.placeService.GenericAPI(body).subscribe({
      next: (data) => {
        this.relationCategoriesNames = data.json;
        this.relationCategoriesNames?.forEach((r) => (r.selected = true));
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

  GetPrompts() {
    const categoryBody = {
      name: 'GetPromptsCategoryId',
      params: {
        Name: 'Availability',
      },
    };
    this.placeService.GenericAPI(categoryBody).subscribe({
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
        this.placeService.GenericAPI(promptsBody).subscribe({
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

    this.spinner.show();
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
                const x = data.json;
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
              },
              error: (err) => {
                reject(err);
              },
            });
          });
        })
      )
      .subscribe({
        complete: () => {
          this.getGeneratedEmails();
          this.spinner.hide();
          this.onSubmit();
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

      centers.push({ id: this.center.Id, centerName: this.center.CenterName });

      const contactDTO: GetContactManagerDTO = {
        ContactId: contact.ContactId,
        ContactName: `${contact.Firstname} ${contact.LastName}`,
        ShoppingCentersName: centers.map((c) => c.centerName),
        ShoppingCentersID: centers.map((c) => c.id.toString()),
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

    this.spinner.show();

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
        this.spinner.hide();
      })
    );
  }

  getGeneratedEmails() {
    this.spinner.show();
    var body: any = {
      Name: 'GetMailContextGenerated',
      MainEntity: null,
      Params: {
        campaignId: this.center.CampaignId,
        ContactId: this.contactId,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (data) => {
        this.returnGetMailContextGenerated = data.json;
        console.log(this.returnGetMailContextGenerated);

        this.spinner.hide();
      },
    });
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

  onSubmit(): void {
    this.onStepDone.emit();
  }
}
