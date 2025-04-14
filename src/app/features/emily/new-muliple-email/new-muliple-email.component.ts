import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Cotenant,
  Generated,
  ShoppingCenterManager,
} from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';
import { from, Observable, of , forkJoin } from 'rxjs';
import { concatMap ,tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmilyService } from 'src/app/core/services/emily.service';
import {
  OrganizationChecked,
  buyboxChecklist,
} from 'src/app/shared/models/sidenavbar';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import {
  GenerateContextDTO,
  GetContactManagerDTO,
  GetManagerOrgDTO,
} from 'src/app/shared/models/GenerateContext';
import { MailContextGenerated } from 'src/app/shared/models/MailContextGenerated';

@Component({
  selector: 'app-new-muliple-email',
  templateUrl: './new-muliple-email.component.html',
  styleUrl: './new-muliple-email.component.css',
})
export class NewMulipleEmailComponent implements OnInit {
  buyBoxId!: any;
  contactId!: any;
  BatchGuid!: string;
  campaignId: any;
  organizationId: any;

  prompts: any[] = [];
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  editablePromptText: string = '';

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
  CheckGetSavedTemplates: any[] = [];
  selectedContact: number[] = [];
  showMoreRelations: { [key: number]: boolean } = {};
  returnGetMailContextGenerated: MailContextGenerated[] = [];
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  MangerDescription: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  selectedShoppingCenter: string = '';
  buyboxChecklist!: buyboxChecklist;
  BuyBoxName: any;
  BuyBoxOrgID: any;
  ShoppingCenterName: any;
  buybox: any;
  allOrganizations: any;
  selectedContactId: number = 0;
  isAdvancedVisible = false;
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];

  bodyTemplates: string[] = [];
  isEditing: boolean = false;
  isEditingBody: boolean = false;
  emailBody: string = '';
  emailBody2: string = '';
  ItemContext: any;
  emailTemplates: {
    organizationId: number;
    contacts?: any[];
    templateOne: string;
    templateTwo: string;
  }[] = [];
  originalEmailTemplates: {
    organizationId: number;
    contacts?: any[];
    templateOne: string;
    templateTwo: string;
  }[] = [];
  ResponseContextEmail: any[] = [];
  selectedContactSC: any = null;

  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private emilyService: EmilyService,
    private modalService: NgbModal,
    private breadcrumbService: BreadcrumbService
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.campaignId = params.get('campaignId');
    });

    this.breadcrumbService.addBreadcrumb({
      label: 'Generate Email',
      url: `/MutipleEmail/${this.campaignId}`,
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

    this.contactId = localStorage.getItem('contactId');
    if (this.buyBoxId) {
      this.GetBuyBoxOrganizationsForEmail();
    }
    this.GetPrompts();
    this.GetBuyBoxInfo();
    this.GetBuyBoxInfoDetails();
    this.GetRetailRelationCategories();
    this.getGeneratedEmails();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
  }

  toggleAdvanced() {
    this.isAdvancedVisible = !this.isAdvancedVisible;
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
        this.selectedContactId =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationContacts?.[0]?.ContactId;

        const buyBox = this.generated?.[0]?.Buybox?.[0];
        if (buyBox) {
          this.ManagerOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
              ?.ManagerOrganizationName || '';
          this.BuyBoxOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.Name || '';

          this.BuyBoxName = buyBox.BuyBoxOrganization?.[0]?.Name || '';
          this.BuyBoxOrgID =
            buyBox.BuyBoxOrganization?.[0]?.BuyBoxOrganizationId || '';
        }

        // Extract Shopping Centers safely
        this.ShoppingCenterNames =
          this.generated?.[0]?.BuyBoxShoppingCenters?.map((center) => ({
            CenterName: center.CenterName,
            ShoppingCenterManager: center.ShoppingCenterManager || [],
            CotenantsWithActivityType: (
              center.Cotenants?.filter((co) => co.ActivityType) || []
            ).map((co) => ({ ...co, selected: false })),

            CotenantsWithoutActivityType:
              center.Cotenants?.filter((cotenant) => !cotenant.ActivityType) ||
              [],
          })) || [];

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

  async GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();
    try {
      const body: any = {
        Name: 'GetBuyBoxReps',
        MainEntity: null,
        Params: {
          buyboxid: this.buyBoxId,
        },
        Json: null,
      };

      const data = await this.PlacesService.GenericAPI(body).toPromise();
      if (data?.json && Array.isArray(data.json)) {
        this.BuyBoxOrganizationsForEmail = data.json;

        this.allOrganizations = this.BuyBoxOrganizationsForEmail.map(
          (org: any) => ({
            ...org,
            selected: true,
          })
        );
        this.allOrganizations.forEach((org: any) => {
          org.isVisible = false;
        });

        this.allOrganizations.forEach((org: any) => {
          if (org.Contact && Array.isArray(org.Contact)) {
            org.Contact.forEach((contact: any) => {
              contact.selected = true;
              if (
                contact.ShoppingCenters &&
                Array.isArray(contact.ShoppingCenters)
              ) {
                contact.ShoppingCenters.forEach((center: any) => {
                  center.selected = true;
                });
              }
            });
          }
        });

        this.emailTemplates = this.allOrganizations.map((org: any) => {
          const contactsContext =
            org.Contact && Array.isArray(org.Contact)
              ? org.Contact.map((contact: any) => {
                  const centersContext =
                    contact.ShoppingCenters &&
                    Array.isArray(contact.ShoppingCenters)
                      ? contact.ShoppingCenters
                      : [];
                  return {
                    ...contact,
                    shoppingCenters: centersContext,
                  };
                })
              : [];
          return {
            organizationId: org.Id,
            contacts: contactsContext,
            templateOne: this.emailBody,
            templateTwo: this.emailBody2,
          };
        });

        this.bodyTemplates = [this.emailBody];
        this.originalEmailTemplates = [...this.emailTemplates];
      }
    } catch (error) {
      console.error('Error in GetBuyBoxOrganizationsForEmail:', error);
    } finally {
      this.spinner.hide();
      this.updateEmailBody();
    }
  }

  checkAllOrg(organization: any, newValue: boolean): void {
    organization.selected = newValue;

    if (organization.Contact && Array.isArray(organization.Contact)) {
      organization.Contact.forEach((contact: any) => {
        contact.selected = newValue;
        if (contact.ShoppingCenters && Array.isArray(contact.ShoppingCenters)) {
          contact.ShoppingCenters.forEach((center: any) => {
            center.selected = newValue;
          });
        }
      });
    }

    // Uncheck
    if (!newValue) {
      this.emailTemplates = this.emailTemplates.filter(
        (template: any) => template.organizationId !== organization.Id
      );
    }
    //  Check
    else {
      let x = this.originalEmailTemplates.filter(
        (template: any) => template.organizationId == organization.Id
      );
      this.emailTemplates.push(x[0]);
    }

    this.updateEmailBody();
  }

  toggleOneOrg(organization: any, event: any) {
    this.allOrganizations.forEach((org: any) => {
      if (org !== organization) {
        org.isVisible = false;
      }
    });
    organization.isVisible = !organization.isVisible;
  }

  checkContact(contact: any, newValue: boolean, organizationId: any): void {
    if (
      !newValue &&
      contact.ShoppingCenters &&
      Array.isArray(contact.ShoppingCenters)
    ) {
      contact.ShoppingCenters.forEach((center: any) => {
        center.selected = false;
      });
    } else if (
      newValue &&
      contact.ShoppingCenters &&
      Array.isArray(contact.ShoppingCenters)
    ) {
      contact.ShoppingCenters.forEach((center: any) => {
        center.selected = true;
      });
    }

    // Uncheck
    if (!newValue) {
      this.emailTemplates.forEach((template: any) => {
        if (template.organizationId == organizationId) {
          template.contacts = template.contacts.filter(
            (c: any) => c.id != contact.id
          );
        }
      });
    }

    //  Check
    else {
      this.originalEmailTemplates.forEach((template: any) => {
        if (template.organizationId == organizationId) {
          let x = template.contacts.filter((c: any) => c.id == contact.id);

          this.emailTemplates.forEach((template) => {
            if (template.organizationId == organizationId) {
              template.contacts?.push(x[0]);
            }
          });
        }
      });
    }

    this.updateEmailBody();
  }

  checkShoppingCenter(shoppingCenter: any): void {
    this.BuyBoxOrganizationsForEmail[0].Contact.forEach((contact) => {
      contact.Centers?.forEach((center) => {
        if (center.id === shoppingCenter.id) {
          center.selected = shoppingCenter.selected;
        }
      });
    });
  }

  updateEmailBody() {
    const managerOrgMap: { [orgId: number]: GetContactManagerDTO[] } = {};

    const newTemplates = this.emailTemplates.map((template: any) => {
      let individualTemplateOne = '';
      const contacts = template.contacts;
      if (contacts?.length > 0) {
        contacts.forEach((contact: any) => {
          if (contact.selected && contact.ShoppingCenters?.length > 0) {
            individualTemplateOne += `- Name: ${contact.Firstname || ''} ${
              contact.Lastname || ''
            }\n`;
            individualTemplateOne += `- id: ${contact.id}\n`;

            const selectedShoppingCentersNames =
              contact.ShoppingCenters?.filter((sp: any) => sp.selected).map(
                (sp: any) => sp.CenterName
              ) || [];

              const selectedShoppingCentersID =
              contact.ShoppingCenters?.filter((sp: any) => sp.selected).map(
                (sp: any) => sp.id
              ) || [];

            const orgId = template.organizationId;
            if (!managerOrgMap[orgId]) {
              managerOrgMap[orgId] = [];
            }
            managerOrgMap[orgId].push({
              ContactId: contact.id,
              ContactName: `${contact.Firstname || ''} ${
                contact.Lastname || ''
              }`,
              ShoppingCentersName: selectedShoppingCentersNames,
              ShoppingCentersID: selectedShoppingCentersID,
            });

            contact.ShoppingCenters?.forEach((sp: any) => {
              if (sp.selected) {
                individualTemplateOne += ` Shopping Center: ${sp.CenterName} \n`;
              }
            });
          }
        });
        individualTemplateOne += '\n';
      }
      return {
        ...template,
        templateOne: individualTemplateOne,
      };
    });

    this.emailTemplates = newTemplates;
    this.emailBody = newTemplates.map((t: any) => t.templateOne).join('\n');

    this.ManagerOrgDTO = Object.keys(managerOrgMap).map((orgIdStr) => ({
      OrganizationId: Number(orgIdStr),
      GetContactManagers: managerOrgMap[Number(orgIdStr)],
    }));
  }

  async PutGenerateContext(): Promise<void> {
    this.ResponseContextEmail = [];
    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }
  
    this.spinner.show();
    const requests = this.ManagerOrgDTO.map(async (managerOrg) => {
      const body: GenerateContextDTO = {
        // IsReply :false,
        // OldMail : '',
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
        GetContactManagers: managerOrg.GetContactManagers,
        OrganizationId: managerOrg.OrganizationId,
      };
  
      try {
        const response = await this.PlacesService.GenerateContext(body).toPromise();
        this.ResponseContextEmail.push(response);
        return response;
      } catch (error) {
        console.error('Error executing API call for', body, ':', error);
        throw error; 
      }
    });
  
    await Promise.all(requests);
    this.spinner.hide();
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

  unCheckAll(event: any) {
    let value = event.target.checked;
    this.allOrganizations.forEach((org: any) => {
      org.selected = value;
      org.Contact.forEach((contact: any) => {
        contact.selected = value;
        contact.ShoppingCenters.forEach((center: any) => {
          center.selected = value;
        });
      });
    });

    if (!value) {
      this.emailTemplates = [];
    } else {
      this.emailTemplates = [...this.originalEmailTemplates];
    }

    this.updateEmailBody();
  }

  async PutMailsDraft(): Promise<void> {
    this.updateEmailBody();
    await this.PutGenerateContext();

    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    this.spinner.show();
    const promptId = Number(this.selectedPromptId);
    const IsCC = this.isISCcSelected;

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
              IsCC: IsCC,
              OrganizationId: Number(responseContextEmail.organizationId),
              context: `${responseContextEmail.context}`,
              BatchGuid: this.BatchGuid,
              CampaignId: this.campaignId,
            },
            Json: null,
          };

          return new Promise<void>((resolve, reject) => {
            this.PlacesService.GenericAPI(body).subscribe({
              next: (data) => {
                const x = data.json
                this.AddMailContextReceivers(x[0].id , x[0].organizationId).subscribe({
                  next: () => {
                  },
                  error: () => {
                  },
                  complete: () => {
                    resolve();
                  }
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
        },
      });
  }

  AddMailContextReceivers(Mid : number , OrgID:number): Observable<any>  {    
    const org = this.ManagerOrgDTO.find((org: any) => org.OrganizationId === OrgID);

    if (!org || !org.GetContactManagers || org.GetContactManagers.length === 0) {
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
  
      return this.PlacesService.GenericAPI(body);
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
        campaignId: this.campaignId,
        ContactId: this.contactId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.returnGetMailContextGenerated = data.json;
        console.log( this.returnGetMailContextGenerated );
        
        this.spinner.hide();
      },
    });
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

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.selectedPromptText = this.editablePromptText;
        this.isEditing = false;
        modal.close();
      },
    });
  }

  async openModal(modal: any, ItemContext?: any) {
    this.ItemContext = ItemContext;
    this.modalService.open(modal, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
      backdrop: true,
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
}
