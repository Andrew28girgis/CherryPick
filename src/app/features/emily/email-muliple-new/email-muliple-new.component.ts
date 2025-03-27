import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Cotenant,
  Generated,
  ManagerOrganization,
  ShoppingCenterManager,
} from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';
import { from } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-email-muliple-new',
  templateUrl: './email-muliple-new.component.html',
  styleUrl: './email-muliple-new.component.css',
})
export class EmailMulipleNewComponent implements OnInit {
  prompts: any[] = [];
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  isLandingSelected: boolean = false;
  isISCcSelected: boolean = false;
  buyBoxId!: any;
  contactId!: any;
  OrgBuybox!: any;
  bodyTemplates: string[] = [];
  bodyTemplate: string = '';
  emailBody: string = '';
  emailBody2: string = '';
  emailTemplates: {
    organizationId: number;
    templateOne: string;
    templateTwo: string;
  }[] = [];
  originalEmailTemplates: { organizationId: number; templateOne: string; templateTwo: string; }[] = [];

  // GetBuyBoxInfo
  generated: Generated[] = [];
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  BuyBoxName: any;
  BuyBoxOrgID: any;
  selectedContactId: number = 0;
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];
  showRelationNames: boolean = false;
  showClientProfile: boolean = false;
  showShoppingCenterDescription: boolean = false;
  showOrganizationManagers: boolean = false;
  showMangerDescriptionDetails: boolean = false;
  showMangerContactSignature: boolean = false;
  showBuyBoxDescriptionDetails: boolean = false;
  showBuyBoxDescription: boolean = false;
  ShoppingCenterDescription: any;
  ShoppingCenterName: any;
  ShoppingCenterNameText: any;
  ShoppingCenterDescriptionText: any;
  managerOrganizations: ManagerOrganization[] = [];
  showMangerDescription: boolean = false;
  MangerDescription: string = '';
  MangerSignature: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  selectedShoppingCenter: string = '';
  groupedActivityTypes: any[] = [];

  // GetRetailRelationCategories
  relationCategoriesNames: RelationNames[] = [];
  buybox: any;
  showMinBuildingSize: boolean = false;

  // GetBuyBoxOrganizationsForEmail
  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  CheckGetSavedTemplates: any[] = [];
  organizationId: any;

  // updateEmailBody
  selectedContact: number[] = [];
  RepresentativeOrganizationContactsThatWillReceiveThisEmail: string =
    'Representative Organization Contacts that will receive this email:';

  // new
  selectedRelations: RelationNames[] = [];
  showMoreRelations: { [key: number]: boolean } = {};
  isEditing: boolean = false;
  isEditingBody: boolean = false;
  editablePromptText: string = '';
  returnGetMailContextGenerated: any[] = [];
  ItemContext: any;

  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = params.get('buyboxid');
    });
  }

  async ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    if (this.buyBoxId) {
      this.GetOrgbuyBox(this.buyBoxId);
    }
    this.GetPrompts();
    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetBuyBoxInfoDetails();
    this.GetMailContextGenerated();
  }

  // GetBuyBoxInfo
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

        this.showRelationNames = true;
        this.showClientProfile = true;
        this.showOrganizationManagers = true;
        this.showShoppingCenterDescription = true;
        this.showMangerDescriptionDetails = true;
        this.showMangerContactSignature = true;
        this.onCheckShoppingCenterDescriptionChange();
        this.onOrganizationManagersChange();
        this.onMangerDescriptionDetailsChange();
        this.onMangerContactSignatureChange();
        this.showBuyBoxDescriptionDetails = true;
        this.onCheckboxBuyBoxDescriptionDetailsChange();
        this.showBuyBoxDescription = true;
        this.onCheckboxBuyBoxDescriptionChange();
        this.updateGroupedActivityTypes();
      },
    });
  }
  onCheckShoppingCenterDescriptionChange() {
    if (this.showShoppingCenterDescription) {
      if (this.generated?.[0]?.BuyBoxShoppingCenters) {
        this.ShoppingCenterDescription =
          this.generated[0].BuyBoxShoppingCenters;
        // .find(
        //   (center) => Number(center.ID) === Number(this.CenterId)
        // );
        if (this.ShoppingCenterDescription) {
          const managerDescription =
            this.ShoppingCenterDescription.ShoppingCenterManager?.[0]
              ?.Description;
          const managerName =
            this.ShoppingCenterDescription.ShoppingCenterManager?.[0]?.Name;
          this.ShoppingCenterName = managerName || 'No name available';
          this.ShoppingCenterNameText = this.ShoppingCenterName;
          this.ShoppingCenterDescriptionText =
            managerDescription || 'No description available';
        } else {
          this.ShoppingCenterName = 'No name available';
          this.ShoppingCenterDescriptionText = 'No description available';
        }
      } else {
        this.ShoppingCenterName = 'No name available';
        this.ShoppingCenterDescriptionText = 'No description available';
      }
    } else {
      this.ShoppingCenterName = '';
      this.ShoppingCenterDescriptionText = '';
    }
  }
  onOrganizationManagersChange() {
    if (this.showOrganizationManagers) {
      this.loadManagerOrganizations();
      this.showMangerDescription = true;
    } else {
      this.managerOrganizations = [];
    }
    this.updateEmailBody();
  }
  loadManagerOrganizations() {
    const buyBoxOrganization = this.generated[0]?.Buybox[0]?.BuyBoxOrganization;

    if (buyBoxOrganization && buyBoxOrganization.length > 0) {
      const managerData = buyBoxOrganization[0]?.ManagerOrganization;
      if (managerData && managerData.length > 0) {
        this.managerOrganizations = managerData;
        this.managerOrganizations.forEach((manager) => {
          manager.ManagerOrganizationContacts.forEach((contact) => {
            contact.selected = true;
          });
          manager.showDescription = true;
        });
      }
    }
    this.selectManagerTenantsByDefault();
  }
  selectManagerTenantsByDefault() {
    this.managerOrganizations.forEach((manager: any) => {
      manager.ManagerOrganizationContacts.forEach((contact: any) => {
        contact.assistantSelected = true;
      });
    });
    this.showMangerDescription = true;
    this.onMangerDescriptionChange();
    this.onAssistantCheckboxChange(this.managerOrganizations);
    this.onContactCheckboxChange();
  }
  onMangerDescriptionChange() {
    if (this.showMangerDescription) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = true;
          if (contact.AssistantName) {
            contact.assistantSelected = true;
          }
        });
      });
    } else {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = false;
          contact.assistantSelected = false;
        });
      });
    }
    this.updateEmailBody();
  }
  onAssistantCheckboxChange(contact: any) {
    if (!contact.assistantSelected) {
      contact.selectedAssistantName = false;
    }
    this.updateEmailBody();
  }
  onContactCheckboxChange() {
    this.updateEmailBody();
  }
  onMangerDescriptionDetailsChange() {
    if (this.showMangerDescriptionDetails) {
      this.MangerDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';
    } else {
      this.MangerDescription = '';
    }
    this.updateEmailBody();
  }
  onMangerContactSignatureChange() {
    if (this.showMangerContactSignature) {
      this.MangerSignature =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';
    } else {
      this.MangerSignature = '';
    }
    this.updateEmailBody();
  }
  onCheckboxBuyBoxDescriptionDetailsChange() {
    if (this.showBuyBoxDescriptionDetails) {
      this.BuyBoxDescriptionDetails =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription || '';
    } else {
      this.BuyBoxDescriptionDetails = '';
    }
  }
  onCheckboxBuyBoxDescriptionChange() {
    if (this.showBuyBoxDescription) {
      this.BuyBoxDescription = this.generated[0]?.Buybox[0]?.Description || '';
    } else {
      this.BuyBoxDescription = '';
    }
  }
  updateGroupedActivityTypes() {
    if (!this.selectedShoppingCenter) return;
    this.groupedActivityTypes = this.getCotenantsWithActivityType(
      this.selectedShoppingCenter
    );
    // Force reset
    this.groupedActivityTypes.forEach((activity) => {
      activity.selected = false;
      activity.Cotenants.forEach((co: any) => (co.selected = false));
    });
  }
  getCotenantsWithActivityType(centerName: string): any[] {
    const center: any = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    this.groupedActivityTypes = center.CotenantsWithActivityType.reduce(
      (result: any, cotenant: any) => {
        const activityType = cotenant.ActivityType || 'Other';
        let group = result.find(
          (item: any) => item.ActivityType === activityType
        );
        if (!group) {
          group = { ActivityType: activityType, Cotenants: [] };
          result.push(group);
        }
        group.Cotenants.push(cotenant);
        return result;
      },
      []
    );
    return center ? this.groupedActivityTypes : [];
  }

  // GetRetailRelationCategories
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
  // GetBuyBoxInfoDetails
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
        this.showMinBuildingSize = true;
        this.onCheckboxdetailsChangeMin(true);
      },
    });
  }

  async GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();

    try {
      if (
        this.OrgBuybox &&
        Array.isArray(this.OrgBuybox) &&
        this.OrgBuybox.length > 0
      ) {
        const organizationIds = this.OrgBuybox.map((item: any) => item.id);

        this.bodyTemplates = [];

        if (organizationIds.length > 0) {
          for (let id of organizationIds) {
            const body: any = {
              Name: 'GetShoppingCenterManagerContacts',
              MainEntity: null,
              Params: {
                buyboxid: this.buyBoxId,
                organizationid: id,
              },
              Json: null,
            };

            try {
              const data = await this.PlacesService.GenericAPI(
                body
              ).toPromise();
              if (data?.json && Array.isArray(data.json)) {
                this.BuyBoxOrganizationsForEmail = data.json;

                this.BuyBoxOrganizationsForEmail[0].Contact.forEach(
                  (c: any) => {
                    c.selected = true;
                    c.Centers?.forEach((ShoppingCenter: any) => {
                      ShoppingCenter.selected = true;
                    });
                  }
                );

                await this.OnCheckGetSavedTemplates(
                  this.BuyBoxOrganizationsForEmail[0].Id
                );

                this.updateEmailBody();

                const currentEmailTemplate = {
                  organizationId: id,
                  templateOne: this.emailBody,
                  templateTwo: this.emailBody2,
                };
                this.emailTemplates.push(currentEmailTemplate);
                this.bodyTemplates.push(this.emailBody);
              }
            } catch (error) {
              console.error(`Error processing organization ID: ${id}`, error);
            }

            await new Promise((resolve) => setTimeout(resolve, 0));
          }
          this.originalEmailTemplates = [...this.emailTemplates];
        }
      } else {
        this.organizationId = null;
      }
    } finally {
      this.spinner.hide();

    }
  }

  async OnCheckGetSavedTemplates(organizationid: number): Promise<void> {
    const body: any = {
      Name: 'GetSavedTemplates',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
        organizationid: organizationid,
      },
      Json: null,
    };

    return new Promise((resolve, reject) => {
      this.PlacesService.GenericAPI(body).subscribe({
        next: (data) => {
          this.CheckGetSavedTemplates = data.json;
          resolve();
        },
        error: (err) => {
          console.error('Error in OnCheckGetSavedTemplates:', err);
          reject(err);
        },
      });
    });
  }

  updateEmailBody() {
    let templateOneContent = '';

    if (this.selectedShoppingCenter) {
      templateOneContent += `Shopping Center Representative Organization: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }
    const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact || [];
    if (selectedContacts?.length > 0) {
      this.selectedContact = [];

      templateOneContent += `${this.RepresentativeOrganizationContactsThatWillReceiveThisEmail}\n`;

      const countSelectedContacts = selectedContacts.filter(
        (contact) => contact.selected && contact?.Centers?.length > 0
      ).length;

      if (this.isISCcSelected == false) {
        templateOneContent += `- Create ${countSelectedContacts} Email For each Contact\n `;
        // emailContent += `- Create Email\n `;
      }
      selectedContacts.forEach((contact) => {
        if (contact.selected && contact?.Centers?.length > 0) {
          templateOneContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
          templateOneContent += `- id: ${contact.id}\n `;
          this.selectedContact.push(contact.id);
        }
        contact.Centers?.forEach((sp) => {
          if (sp.selected) {
            templateOneContent += ` Shopping Center: ${sp.CenterName} \n `;
          }
        });
      });

      templateOneContent += '\n';
    }
    let templateTwoContent = '';

    templateTwoContent += this.buildClientProfileSection();
    templateTwoContent += this.buildMinBuildingSizeSection();
    templateTwoContent += this.buildRelationNamesSection();
    templateTwoContent += this.buildManagerSection();
    templateTwoContent += this.buildDescriptionSection();
    templateTwoContent += this.buildLandingChangeSection();

    this.emailTemplates = this.emailTemplates.map(template => ({
      ...template,
      templateTwo: templateTwoContent
    }));

    this.emailBody2 = templateTwoContent;
    this.emailBody = templateOneContent;
  }
  buildClientProfileSection(): string {
    if (this.showClientProfile) {
      return `New Tenant that wish to open on this shopping center: (${this.BuyBoxOrganizationName})\n\n`;
    }
    return '';
  }
  buildMinBuildingSizeSection(): string {
    let sizeContent = '';
    if (this.showMinBuildingSize) {
      sizeContent += `The Required Min Unit Size for Lease (${this.buybox?.MinBuildingSize} Sqft)\n`;
      sizeContent += `The Required Max Unit Size for Lease (${this.buybox?.MaxBuildingSize} Sqft)\n\n`;
    }
    return sizeContent;
  }
  buildRelationNamesSection(): string {
    let relationContent = '';
    if (this.showRelationNames) {
      const organizationName = this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]?.Name || 'No Organization Name';
      const categoryMap: { [key: string]: string[] } = {};

      this.relationCategoriesNames?.forEach((selectedRelation) => {
        if (selectedRelation.selected) {
          this.generated[0]?.Releations?.forEach((relation) => {
            if (relation.RetailRelationCategoryId === selectedRelation.id && relation.relationSelect && this.isRelationCategoryMatched(relation)) {
              const categoryName = this.getRelationCategoryName(relation.RetailRelationCategoryId);
              if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = [];
              }
              categoryMap[categoryName].push(relation.Name);
            }
          });
        }
      });

      for (const category in categoryMap) {
        relationContent += `${organizationName} ${category}\n`;
        categoryMap[category].forEach((relationName) => {
          relationContent += `- ${relationName}\n`;
        });
        relationContent += '\n'; // Add spacing between categories
      }
    }
    return relationContent;
  }
  buildManagerSection(): string {
    let managerContent = '';
    if (this.showOrganizationManagers) {
      this.managerOrganizations.forEach((manager) => {
        managerContent += `${this.BuyBoxOrganizationName} Representative Brokerage Company: ${manager.ManagerOrganizationName}\n\n`;
        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            managerContent += `Broker on Charge Assistant that is sending this email: ${contact.Firstname} ${contact.LastName}\n\n`;
          }
        });
      });
    }
    return managerContent;
  }
  buildDescriptionSection(): string {
    let descriptionContent = '';
    if (this.showMangerDescriptionDetails) {
      this.managerOrganizations.forEach((manager) => {
        descriptionContent += `${manager.ManagerOrganizationName} Description: ${this.MangerDescription}\n`;
      });
    }
    if (this.showMangerDescription) {
      this.managerOrganizations.forEach((manager) => {
        descriptionContent += `${manager.ManagerOrganizationName} Description: ${this.MangerDescription}\n`;
      });
    }

    if (this.showBuyBoxDescriptionDetails) {
      descriptionContent += `${this.BuyBoxOrganizationName} Description: (${this.BuyBoxDescriptionDetails})\n\n`;
    }

    if (this.showBuyBoxDescription) {
      descriptionContent += `BuyBox Description: (${this.BuyBoxDescription})\n\n`;
    }

    if (this.showShoppingCenterDescription) {
      descriptionContent += `${this.ShoppingCenterName} Description: (${this.ShoppingCenterDescriptionText})\n\n`;
    }

    if (this.showMangerContactSignature) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            descriptionContent += `\nUse This Email Signature:\n`;
            descriptionContent += `${contact.EmailSignature}\n\n`;
          }
        });
      });
    }
    return descriptionContent;
  }
  buildLandingChangeSection(): string {
    let LandingChange = '';
    if (this.isLandingSelected) {
      const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
      LandingChange += `\nLanding page: <a href="${landingLink}">${landingLink}</a>`;
    }
    return LandingChange;
  }
  onCheckboxdetailsChangeMin(event: any) {
    this.showMinBuildingSize = event.target.checked;
    this.updateEmailBody();
  }
  onCheckboxClientProfileSection(event: any) {
    this.showClientProfile = event.target.checked;
    this.updateEmailBody();
  }
  onCheckboxBuyBoxDescriptionDetailsProfileChange(event?: any) {
    this.showBuyBoxDescriptionDetails = event.target.checked;
    this.updateEmailBody();
  }
  onCheckboxBuyBoxDescriptionProfileChange(event?: any) {
    this.showBuyBoxDescription = event.target.checked;
    this.updateEmailBody();
  }
  onCheckShoppingCenterDescriptionProfileChange(event?: any) {
    this.showShoppingCenterDescription = event.target.checked;
    this.updateEmailBody();
  }
  onShowRelationNamesChange(event: any): void {
    this.showRelationNames = event.target.checked;
    this.updateEmailBody();
  }
  onIndividualRelationChange(category: RelationNames): void {
    const newValue = category.selected;
    if (this.generated && this.generated.length > 0 && this.generated[0].Releations) {
      this.generated[0].Releations.forEach((item:any) => {
        if (item.RetailRelationCategoryId === category.id) {
          item.relationSelect = newValue;
        }
      });
    }
    this.updateEmailBody();
  }
  
  onOrganizationManagersNameChange(event: any): void {
    this.showOrganizationManagers = event.target.checked;
    this.showMangerDescriptionDetails = event.target.checked;
    this.showMangerDescription = event.target.checked;
    this.showMangerContactSignature = event.target.checked;
    this.updateEmailBody();
  }
  onMangerDescriptionDetailsShowChange(event: any): void {
    this.showMangerDescriptionDetails = event.target.checked;
    this.updateEmailBody();
  }
  onMangerDescriptionShowChange(event: any): void {
    this.showMangerDescription = event.target.checked;
    this.showMangerContactSignature = event.target.checked;
    this.updateEmailBody();
  }
  onMangerContactSignatureShowChange(event: any): void {
    this.showMangerContactSignature = event.target.checked;
    this.updateEmailBody();
  }
  onLandingChangeShowChange(event: any): void {
    this.isLandingSelected = event.target.checked;
    this.updateEmailBody();
  }

  

  getManagerName(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center?.ShoppingCenterManager?.[0]?.Name || 'No Manager';
  }

  getCotenantsWithoutActivityType(centerName: string): Cotenant[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center ? center.CotenantsWithoutActivityType : [];
  }

  isRelationCategoryMatched(relation: any): boolean {
    return this.relationCategoriesNames.some(
      (category) => category.id === relation.RetailRelationCategoryId
    );
  }

  getRelationCategoryName(id: number): string {
    const category = this.relationCategoriesNames.find(
      (category) => category.id === id
    );
    return category ? category.name : 'Unknown Category';
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
            } else {
              this.prompts = [];
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

  GetOrgbuyBox(buyboxId: number): void {
    const body: any = {
      Name: 'GetOrganizationsByBuyBox',
      MainEntity: null,
      Params: {
        BuyBoxId: buyboxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.OrgBuybox = data.json;
          this.GetBuyBoxOrganizationsForEmail();
        } else {
          this.OrgBuybox = [];
        }
      },
    });
  }

  async PutMailsDraft(): Promise<void> {
    this.updateEmailBody();

    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    this.spinner.show();
    const promptId = Number(this.selectedPromptId);
    const IsCC = this.isISCcSelected;

    from(this.emailTemplates)
      .pipe(
        concatMap((emailTemplate, index) => {
          const body: any = {
            Name: 'PutMailsDraft',
            MainEntity: null,
            Params: {
              BuyBoxId: this.buyBoxId,
              ContactId: this.contactId,
              PromptId: promptId,
              IsCC: IsCC,
              OrganizationId: Number(emailTemplate.organizationId),
              context: `${emailTemplate.templateOne}${emailTemplate.templateTwo}`,
            },
            Json: null,
          };

          return new Promise<void>((resolve, reject) => {
            this.PlacesService.GenericAPI(body).subscribe({
              next: (data) => {
                resolve();
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
          this.spinner.hide();
        },
        error: (error: any) => {
          console.error('Error:', error);
          this.spinner.hide();
        },
      });
  }

  GetMailContextGenerated() {
    this.spinner.show();

    var body: any = {
      Name: 'GetMailContextGenerated',
      MainEntity: null,
      Params: {
        BuyBoxId: this.buyBoxId,
        ContactId: this.contactId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.returnGetMailContextGenerated = data.json;
        this.spinner.hide();
      },
    });
  }

  onIncludeLandingChange(event: any): void {
    this.isLandingSelected = event.target.checked;
    const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
    const snippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;

    this.emailTemplates = this.emailTemplates.map((templateItem) => {
      let updatedTemplate = templateItem.templateTwo;
      if (this.isLandingSelected) {
        if (!updatedTemplate.includes(snippet)) {
          updatedTemplate += snippet;
        }
      } else {
        updatedTemplate = updatedTemplate.replace(snippet, '');
      }
      return { ...templateItem, templateTwo: updatedTemplate };
    });
  }

  onISCCChange(event: any): void {
    this.isISCcSelected = event.target.checked;
    const createLineRegex = /- Create .* Email For each Contact\n\s*/;
    this.emailTemplates = this.emailTemplates.map((templateItem) => {
      let updatedTemplate = templateItem.templateOne;

      if (this.isISCcSelected) {
        updatedTemplate = updatedTemplate.replace(createLineRegex, '');
      } else {
        const originalItem = this.originalEmailTemplates.find(
          (item: any) => item.organizationId === templateItem.organizationId
        );
        if (originalItem) {
          updatedTemplate = originalItem.templateOne;
        }
      }
      return { ...templateItem, templateOne: updatedTemplate };
    });
  }

  // onRelationNamesChange() {
  //   this.relationCategoriesNames.forEach((relation) => {
  //     if (relation.selected) {
  //       this.generated[0]?.Releations.forEach((item) => {
  //         if (item.RetailRelationCategoryId === relation.id) {
  //           item.relationSelect = true;
  //         }
  //       });
  //     } else {
  //       this.generated[0]?.Releations.forEach((item) => {
  //         if (item.RetailRelationCategoryId === relation.id) {
  //           item.relationSelect = false;
  //         }
  //       });
  //     }
  //   });
  //   this.updateSelectedRelations();
  //   this.updateEmailBody();
  // }

  // updateSelectedRelations() {
  //   this.selectedRelations = [];
  //   this.generated[0]?.Releations.forEach((relation) => {
  //     if (this.isRelationCategoryMatched(relation)) {
  //       this.selectedRelations.push({
  //         id: relation.RetailRelationCategoryId,
  //         name: this.getRelationCategoryName(relation.RetailRelationCategoryId),
  //       });
  //     }
  //   });
  //   this.updateEmailBody();
  // }

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

  openModal(modal: any, ItemContext?: any) {
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