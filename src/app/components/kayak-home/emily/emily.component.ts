import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  Cotenant,
  Generated,
  ManagerOrganization,
  ShoppingCenterManager,
} from 'src/models/emailGenerate';
import { RelationNames } from 'src/models/emailGenerate';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/services/places.service';
import { FormGroup } from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import { Center } from 'src/models/shoppingCenters';
import { NgxSpinnerService } from 'ngx-spinner';
import { BuyBoxOrganizationsForEmail } from 'src/models/buyboxOrganizationsForEmail';

@Component({
  selector: 'app-emily',
  templateUrl: './emily.component.html',
  styleUrls: ['./emily.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }),
        animate('500ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ height: '0px', opacity: 0 })),
      ]),
    ]),
  ],
})
export class EmilyComponent implements OnInit {
  @Output() contentChange = new EventEmitter<string>();
  buyBoxId!: any;
  orgId!: any;
  CenterId!: any;
  showMoreRelations: { [key: number]: boolean } = {};
  TemplatesId!: number | null;
  General!: any;
  generated: Generated[] = [];
  relationCategoriesNames: RelationNames[] = [];
  showClientProfile: boolean = false;
  showMinBuildingSize: boolean = false;
  showMaxBuildingSize: boolean = false;
  showMangerDescription: boolean = false;
  showMangerDescriptionDetails: boolean = false; /////////////
  showBuyBoxDescriptionDetails:boolean = false;
  showShoppingCenterDescription:boolean = false;
  showBuyBoxDescription:boolean = false;
  clientProfileDescription: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  ShoppingCenterDescription: any;
  MangerDescription: string = '';
  showRelationNames: boolean = false;
  selectedRelations: RelationNames[] = [];
  showOrganizationManagers: boolean = false; ////////////
  managerOrganizations: ManagerOrganization[] = [];
  showManagerDescription: boolean = false;
  emailBody: string = '';
  manager: any;
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  selectedShoppingCenter: string = ''; 
  showManagerName: boolean = false;
  showCotenantsWithActivity: boolean = false;
  showCotenantsWithoutActivity: boolean = false;
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  selectedPromptName: string = '';
  prompts: any[] = [];
  emailSubject: string = '';
  emailBodyResponse: string = '';
  emailId!: number;
  isEditing: boolean = false;
  isEditingBody: boolean = false;
  editablePromptText: string = '';
  groupedActivityTypes: any[] = [];
  showAllCotenants: boolean = false;
  isSubjectCopied: boolean = false;
  isBodyCopied: boolean = false;
  formGroupTemplate!: FormGroup;
  shouldShowGenerateEmaily: boolean = false;
  ShowSpinner: boolean = false;
  expressionEmail: boolean = true;
  shoppingCenters: Center[] = [];
  shoppingCentersSelected: Center | undefined = undefined;
  generatedGetSavedTemplates: any;
  contactidsJoin: any;
  buybox: any;
  shoppingCenterOrganization!: number;
  selectedEmailyID: string | null = null;
  showSelections = true;
  selectedIndex!: number;
  CheckGetSavedTemplates: any[] = [];
  isEmailSectionVisible: boolean = true;
  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];
  ShoppingCenterAfterLoopDescription: any;
  ShoppingCenterDescriptionText: any;
  ShoppingCenterName: any;
  ShoppingCenterNameText: any;
  showAllRelations = false;
  
  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = params.get('buyboxId');
      this.orgId = params.get('orgId');
      this.CenterId = params.get('CenterId');
      this.shoppingCenterOrganization = this.orgId;
      this.GetBuyBoxOrganizationsForEmail();
    });
  }

  ngOnInit() {
    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetPrompts();
    this.GetBuyBoxInfoDetails();
    this.spinner.show();

    
    setTimeout(() => {
      this.showClientProfile = true;
      this.showRelationNames = true;
      this.showOrganizationManagers = true;
      this.showManagerName = true;
      this.showMangerDescription = true;
      this.showMangerDescriptionDetails=true;
      this.showMinBuildingSize = true;
      this.showMaxBuildingSize = true;
      this.showBuyBoxDescription = true;
      this.showBuyBoxDescriptionDetails =true;
      this.showShoppingCenterDescription =true;
      this.onOrganizationManagersChange();
      this.onMangerDescriptionChange();
      this.onCheckboxBuyBoxDescriptionDetailsChange();
      this.onCheckboxBuyBoxDescriptionChange();
      this.onCheckShoppingCenterDescriptionChange();
      this.onMangerDescriptionDetailsChange();
      this.onCheckboxdetailsChangeMin(true, true);
      this.selectManagerContactsByDefault();
      this.selectManagerTenantsByDefault();
      this.spinner.hide();
    }, 3000);
  }

  GetBuyBoxInfoDetails() {
    this.spinner.show();
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
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching buybox info:', err);
        this.spinner.hide();
      },
    });
  }
  
  getShoppingCenters(buyboxId: number): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.shoppingCentersSelected = this.shoppingCenters.find(
          (S: Center) => S.Id == this.shoppingCenterOrganization
        );
        this.selectedShoppingCenter =
          this.ShoppingCenterNames.find(
            (center) =>
              center.CenterName === this.shoppingCentersSelected?.CenterName
          )?.CenterName || '';
        this.onSelectedShoppingCenterChange();
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  selectManagerContactsByDefault() {
    this.spinner.show();
    this.getManagerContacts(this.selectedShoppingCenter).forEach((contact) => {
      contact.selectedName = true;
      this.spinner.hide();
    });

    this.onContactCheckboxChange();
    this.updateEmailBody();
  }

  selectManagerTenantsByDefault() {
    this.managerOrganizations.forEach((manager: any) => {
      manager.ManagerOrganizationContacts.forEach((contact: any) => {
        contact.assistantSelected = true;
      });
    });
    this.onAssistantCheckboxChange(this.managerOrganizations);
    this.onContactCheckboxChange();
  }

  OnCheckGetSavedTemplates(organizationid: number): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetSavedTemplates',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
        organizationid: organizationid,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CheckGetSavedTemplates = data.json;
        this.spinner.hide();
      },
    });
  }

  GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();
    const body: any = {
      Name: 'GetShoppingCenterManagerContacts',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
        organizationid: this.shoppingCenterOrganization,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.BuyBoxOrganizationsForEmail = data.json;

          this.BuyBoxOrganizationsForEmail[0].Contact.forEach((c: any) => {
            c.selected = true;
            c.Centers?.forEach((ShoppingCenter: any) => {
              ShoppingCenter.selected = true;
            });
          });
          this.updateEmailBody();
          this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
          this.spinner.hide();
        } else {
          this.BuyBoxOrganizationsForEmail = [];
          console.error('Unexpected data format:', data);
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('API error:', err);
        this.BuyBoxOrganizationsForEmail = [];
        this.spinner.hide();
      },
    });
  }

  onContactChange(item: any, newValue: boolean): void {
    if (!newValue) {
      item.Centers?.forEach((center: any) => {
        center.selected = false;
      });
    } else {
      item.Centers?.forEach((center: any) => {
        center.selected = true;
      });
    }
  }

  onShoppingCenterChange(selectedContact: any, shoppingCenter: any): void {
    this.BuyBoxOrganizationsForEmail[0].Contact.forEach((contact) => {
      contact.Centers?.forEach((center) => {
        if (center.id === shoppingCenter.id) {
          center.selected = shoppingCenter.selected;
        }
      });
  
      contact.selected = contact.Centers.some((sc: any) => sc.selected);
    });
  }
  
  GetBuyBoxInfo() {
    this.spinner.show();
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
        console.log('All', this.generated);

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
        // console.log(this.ShoppingCenterNames);

        this.generated?.[0]?.Releations?.forEach(
          (r) => {r.relationSelect = true}
        );
 
        //this for to be selected by first shopping center by defaukt
        // if (this.ShoppingCenterNames.length > 0) {
        //   this.selectedShoppingCenter = this.ShoppingCenterNames[0].CenterName;
        // }
        this.updateGroupedActivityTypes();
        this.spinner.hide();
      },
    });
  }

  objectEmailSavedtemplate: any;
  SaveTemplate() {
    this.spinner.show();
    let contactId: any;
    this.managerOrganizations[0].ManagerOrganizationContacts.forEach((c) => {
      if (c.selected) {
        contactId = c.ContactId;
      }
    });
    let contacts = this.selectedContact.join(`,`);
    const body: any = {
      Name: 'SaveTemplate',
      MainEntity: null,
      Params: {
        organizationid: this.shoppingCenterOrganization,
        template: this.emailBodyResponse,
        subject: this.emailSubject,
        buyboxid: this.buyBoxId,
        contactid: contactId, //andrew
        contactids: contacts,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Saved successfully!');
        this.objectEmailSavedtemplate = data?.json[0];
        this.expressionEmail = false;
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.isEmailSectionVisible = true;
        this.spinner.hide();
      },
    });
  }

  SaveAndSendTemplate() {
    this.SaveTemplate();
    setTimeout(() => {
      const body = {
        name: 'SendTemplate',
        params: {
          id: +this.objectEmailSavedtemplate?.templateId,
        },
      };
      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);

          this.showToast('Email Save and Send successfully!');
        },
        error: (err) => {
          console.error('Error updating prompt:', err);
          alert('Failed to update the prompt. Please try again.');
        },
      });
    }, 2000);
  }

  SendEmailTemplate(email: any) {
    const body = {
      name: 'SendTemplate',
      params: {
        id: email.Id,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.showToast('Email Send successfully!');
      },
      error: (err) => {
        console.error('Error updating prompt:', err);
        alert('Failed to update the prompt. Please try again.');
      },
    });
  }

  getCotenantsWithActivityType(centerName: string): any[] {
    const center: any = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    // console.log('Shopping Centers', center);
    this.groupedActivityTypes = center.CotenantsWithActivityType.reduce(
      (result: any, cotenant: any) => {
        const activityType = cotenant.ActivityType || 'Other'; // If no ActivityType, group as 'Other'
        // Check if the ActivityType group already exists
        let group = result.find(
          (item: any) => item.ActivityType === activityType
        );
        if (!group) {
          // If the group doesn't exist, create a new group for this ActivityType
          group = { ActivityType: activityType, Cotenants: [] };
          result.push(group);
        }
        // Add the cotenant to the corresponding group
        group.Cotenants.push(cotenant);
        return result;
      },
      [] // Initialize as an empty array
    );
    return center ? this.groupedActivityTypes : [];
  }

  getCotenantsWithoutActivityType(centerName: string): Cotenant[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center ? center.CotenantsWithoutActivityType : [];
  }

  onSelectedShoppingCenterChange() {
    if (!this.selectedShoppingCenter) return;
    this.updateGroupedActivityTypes();
    this.showAllCotenants = false;
    this.showCotenantsWithActivity = false;
    this.showCotenantsWithoutActivity = false;

    this.groupedActivityTypes.forEach((activity) => {
      activity.selected = false;
      activity.Cotenants.forEach((co: any) => (co.selected = false));
    });

    const withoutActivity = this.getCotenantsWithoutActivityType(
      this.selectedShoppingCenter
    );
    withoutActivity.forEach((co) => (co.selected = false));

    this.selectManagerContactsByDefault();

    this.updateEmailBody();
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
  // Called when "All Cotenants" checkbox changes
  onAllCotenantsChange() {
    if (this.showAllCotenants) {
      // Select both types
      this.showCotenantsWithActivity = true;
      this.showCotenantsWithoutActivity = true;
    } else {
      // Deselect both
      this.showCotenantsWithActivity = false;
      this.showCotenantsWithoutActivity = false;
    }

    // Apply the changes by calling the individual handlers
    this.onCotenantsWithActivityChange();
    this.onCotenantsWithoutActivityChange();
    // updateEmailBody() will be called inside these methods
  }
  // Called when "Cotenants in the shopping center" checkbox changes
  onCotenantsWithActivityChange() {
    const newValue = this.showCotenantsWithActivity;
    this.groupedActivityTypes.forEach((activity) => {
      activity.selected = newValue;
      activity.Cotenants.forEach((co: any) => (co.selected = newValue));
    });

    // If both groups selected, showAllCotenants = true; else false
    this.showAllCotenants =
      this.showCotenantsWithActivity && this.showCotenantsWithoutActivity;
    this.updateEmailBody();
  }
  // Called when "Cotenants without shopping center" checkbox changes
  onCotenantsWithoutActivityChange() {
    const newValue = this.showCotenantsWithoutActivity;
    const cotenantsWithout = this.getCotenantsWithoutActivityType(
      this.selectedShoppingCenter
    );
    cotenantsWithout.forEach((co) => (co.selected = newValue));

    // If both groups selected, showAllCotenants = true; else false
    this.showAllCotenants = this.showCotenantsWithActivity && newValue;
    this.updateEmailBody();
  }
  // Called when an activity checkbox changes
  onActivityChange(activity: any) {
    const newValue = activity.selected;
    activity.Cotenants.forEach((co: any) => (co.selected = newValue));

    // If any activity is selected, showCotenantsWithActivity = true else false
    const anySelected = this.groupedActivityTypes.some((act) => act.selected);
    this.showCotenantsWithActivity = anySelected;

    // Update showAllCotenants accordingly
    this.showAllCotenants =
      this.showCotenantsWithActivity && this.showCotenantsWithoutActivity;
    this.updateEmailBody();
  }
  selectAllCotenants(type: string) {
    if (type === 'withActivity') {
      // Get all cotenants for the selected shopping center
      const cotenants = this.getCotenantsWithActivityType(
        this.selectedShoppingCenter
      );
      // If 'showCotenantsWithActivity' is true, select all cotenants
      cotenants.forEach((cotenant) => {
        cotenant.selected = this.showCotenantsWithActivity; // Select or deselect all cotenants
      });
      // Now select/deselect all activity types as well
      this.groupedActivityTypes.forEach((activity) => {
        activity.selected = this.showCotenantsWithActivity; // Select all activity types if the main checkbox is checked
        // Select or deselect all cotenants under the activity type
        activity.Cotenants.forEach((cotenant: any) => {
          cotenant.selected = this.showCotenantsWithActivity; // Match the cotenant selection with the activity type selection
        });
      });
    }

    if (type === 'withoutActivity') {
      const cotenants = this.getCotenantsWithoutActivityType(
        this.selectedShoppingCenter
      );
      cotenants.forEach(
        (cotenant) => (cotenant.selected = this.showCotenantsWithoutActivity)
      );
    }
    this.updateEmailBody(); // Update the email body after selection
  }
  // Function to select/deselect all cotenants within a specific ActivityType
  selectAllCotenantsForActivity(activity: any) {
    // Update the selection state of cotenants in the activity
    activity.Cotenants.forEach((cotenant: any) => {
      cotenant.selected = activity.selected;
    });
    // Check if any activity is selected after this change
    const anyActivitySelected = this.groupedActivityTypes.some(
      (act) => act.selected
    );
    // Update the main "Cotenants with Activity Type" checkbox based on selection state
    this.showCotenantsWithActivity = anyActivitySelected;
    // Update the email body when this action is performed
    this.updateEmailBody();
  }

  getManagerName(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center?.ShoppingCenterManager?.[0]?.Name || 'No Manager';
  }
  // Get Manager Description
  getManagerDescription(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return (
      center?.ShoppingCenterManager?.[0]?.Description ||
      'No description available'
    );
  }
  // Get Manager Contacts
  getManagerContacts(centerName: any): any[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );

    return (
      center?.ShoppingCenterManager?.[0]?.ShoppingCenterManagerContact || []
    );
  }

  getManagerContactsx(centerName: any): any[] {
    this.BuyBoxOrganizationsForEmail.forEach((OrganizationsForEmail) => {
      OrganizationsForEmail.Contact;
    });

    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );

    return (
      center?.ShoppingCenterManager?.[0]?.ShoppingCenterManagerContact || []
    );
  }

  emailBodyResponsetogale: boolean = false;

  toggleSwitch() {
    this.emailBodyResponsetogale = !this.emailBodyResponsetogale;
  }

  GetRetailRelationCategories() {
    this.spinner.show();

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
        console.log(' this.relationCategoriesNames ', this.relationCategoriesNames );
        
        this.relationCategoriesNames.forEach((r) => (r.selected = true));
        this.spinner.hide();
      },
    });
  }

  onCheckboxChange() {
    if (this.showMangerDescription) {
      this.clientProfileDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription || '';
    } else {
      this.clientProfileDescription = ''; // Clear it if unchecked
    }
  }

  onCheckboxBuyBoxDescriptionDetailsChange() {
    if (this.showBuyBoxDescriptionDetails) {
      
      this.BuyBoxDescriptionDetails =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription || '';

    } else {
      this.BuyBoxDescriptionDetails = ''; // Clear it if unchecked
    }
  }

  onCheckboxBuyBoxDescriptionChange() {
    if (this.showBuyBoxDescription) {
      
      this.BuyBoxDescription =
        this.generated[0]?.Buybox[0]?.Description || '';

    } else {
      this.BuyBoxDescription = ''; 
    }
  }

  onCheckShoppingCenterDescriptionChange() {
    if (this.showShoppingCenterDescription) {
      if (this.generated?.[0]?.BuyBoxShoppingCenters) {
        this.ShoppingCenterDescription = this.generated[0].BuyBoxShoppingCenters.find((center) => Number(center.ID) === Number(this.CenterId));
        if (this.ShoppingCenterDescription) {
          const managerDescription = this.ShoppingCenterDescription.ShoppingCenterManager?.[0]?.Description;
          const managerName = this.ShoppingCenterDescription.ShoppingCenterManager?.[0]?.Name;
          this.ShoppingCenterName = managerName || 'No name available';
          this.ShoppingCenterNameText = this.ShoppingCenterName;
          this.ShoppingCenterDescriptionText = managerDescription || 'No description available';
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
  
  onCheckboxdetailsChangeMin(
    showMinBuildingSize: any,
    showMaxBuildingSize: any
  ) {
    if (
      showMinBuildingSize?.target?.checked &&
      showMaxBuildingSize?.target?.checked
    ) {
      this.updateEmailBody();
    } else {
      // Check if the target and the property exist before toggling
      if (
        showMinBuildingSize?.target &&
        typeof showMinBuildingSize.target.showMinBuildingSize !== 'undefined'
      ) {
        showMinBuildingSize.target.showMinBuildingSize =
          !showMinBuildingSize.target.showMinBuildingSize;
      }
      if (
        showMaxBuildingSize?.target &&
        typeof showMaxBuildingSize.target.showMinBuildingSize !== 'undefined'
      ) {
        showMaxBuildingSize.target.showMinBuildingSize =
          !showMaxBuildingSize.target.showMinBuildingSize;
      }
      this.updateEmailBody();
    }
  }
  
  onOrganizationManagersChange() {
    this.spinner.show();
    if (this.showOrganizationManagers) {
      this.loadManagerOrganizations();
      this.showMangerDescription = true;
      this.spinner.hide();
    }
     else {
      this.managerOrganizations = [];
      this.spinner.hide();
    }
    this.updateEmailBody();
  }

  onMangerDescriptionDetailsChange() {
    if (this.showMangerDescriptionDetails){
      this.MangerDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';
    }else{
      this.MangerDescription = '';
    }
    // Update the email body after changes
    this.updateEmailBody();
  }

  onMangerDescriptionChange() {
    this.spinner.show();
    if (this.showMangerDescription) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = true; // Select the manager checkbox
          if (contact.AssistantName) {
            contact.assistantSelected = true; // Select the assistant checkbox
            this.spinner.hide();
          }
        });
      });
    } else {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = false; // Deselect the manager checkbox
          contact.assistantSelected = false; // Deselect the assistant checkbox
          this.spinner.hide();
        });
      });
    }
    // Update the email body after changes
    this.updateEmailBody();
  }

  onRelationNamesChange() {
    this.relationCategoriesNames.forEach((relation) => {
      // If the parent checkbox is selected, select all its children      
      if (relation.selected) {
        this.generated[0]?.Releations.forEach((item) => {
          if (item.RetailRelationCategoryId === relation.id) {
            item.relationSelect = true;
          }
        });
      } else {
        // If the parent checkbox is deselected, deselect all its children
        this.generated[0]?.Releations.forEach((item) => {
          if (item.RetailRelationCategoryId === relation.id) {
            item.relationSelect = false;
          }
        });
      }
    });
    // Update email body and selected relations
    this.updateSelectedRelations();
    this.updateEmailBody();
  }

  getRelationsForCategory(categoryId: number) {
    if (!this.generated || this.generated.length === 0 || !this.generated[0].Releations) {
      return [];// Avoid errors caused by undefined
    }
    return this.generated[0].Releations.filter(item => item.RetailRelationCategoryId === categoryId);
  }

 // Returns only the first 3 relationships or all of them depending on the condition of Show More
  getVisibleRelations(categoryId: number) {
    const relations = this.getRelationsForCategory(categoryId);
    return this.showMoreRelations[categoryId] ? relations : relations.slice(0, 3);
  }

// Toggle the Show More status for each category
  toggleShowMore(categoryId: number) {
    this.showMoreRelations[categoryId] = !this.showMoreRelations[categoryId];
  }

  updateSelectedRelations() {
    this.selectedRelations = [];
    this.generated[0]?.Releations.forEach((relation) => {
      if (this.isRelationCategoryMatched(relation)) {
        this.selectedRelations.push({
          id: relation.RetailRelationCategoryId,
          name: this.getRelationCategoryName(relation.RetailRelationCategoryId),
        });
      }
    });
    this.updateEmailBody();
  }

  // Check if the RetailRelationCategoryId matches any id in the relationCategoriesNames array
  isRelationCategoryMatched(relation: any): boolean {
    return this.relationCategoriesNames.some(
      (category) => category.id === relation.RetailRelationCategoryId
    );
  }
  // Get the name of the relation category based on RetailRelationCategoryId
  getRelationCategoryName(id: number): string {
    const category = this.relationCategoriesNames.find(
      (category) => category.id === id
    );
    return category ? category.name : 'Unknown Category';
  }

  onContactCheckboxChange() {
    this.updateEmailBody();
  }

  loadManagerOrganizations() {
    // Extract the manager data from the generated BuyBox object
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
  }

  onManagerDescriptionChange() {
    this.updateEmailBody();
  }

  generateAssistantEmail(assistantName: string): string {
    if (!assistantName) return '';
    return assistantName.toLowerCase().replace(/\s+/g, '') + '@cherrypick.com';
  }

  onAssistantCheckboxChange(contact: any) {
    if (!contact.assistantSelected) {
      contact.selectedAssistantName = false; // Reset selection
    }
    this.updateEmailBody();
  }

  selectedContact: number[] = [];

  updateEmailBody() {
    let emailContent = '';
    if (this.selectedShoppingCenter) {
      emailContent += `Shopping Center Representative Organization: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }

    const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact;

    if (selectedContacts?.length > 0) {
      this.selectedContact = [];
      emailContent +=
        'Representative Organization Contacts that will receive this email:\n';
      this.BuyBoxOrganizationsForEmail[0].Contact.forEach((contact) => {
        if (contact.selected && contact?.Centers?.length > 0) {
          emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
          this.selectedContact.push(contact.id);
        }
        contact.Centers?.forEach((sp) => {
          if (sp.selected) {
            emailContent += ` Shopping Center: ${sp.CenterName} \n `;
          }
        });
      });
      emailContent += '\n';
    }

    if (this.showCotenantsWithActivity) {
      const anySelected = this.groupedActivityTypes.some((activity: any) =>
        activity.Cotenants.some((co: any) => co.selected)
      );

      if (anySelected) {
        emailContent += 'Cotenants in the shopping center:\n';
        this.groupedActivityTypes.forEach((activity) => {
          const selectedCotenants = activity.Cotenants.filter(
            (co: any) => co.selected
          );
          if (selectedCotenants.length > 0) {
            emailContent += `${activity.ActivityType}:\n`;
            selectedCotenants.forEach((co: any) => {
              emailContent += `- ${co.CotenantName}\n`;
            });
          }
        });
        emailContent += '\n';
      }
    }

    if (this.showCotenantsWithoutActivity) {
      const cotenantsWithout = this.getCotenantsWithoutActivityType(
        this.selectedShoppingCenter
      ).filter((co) => co.selected);
      if (cotenantsWithout.length > 0) {
        emailContent += 'Cotenants without shopping center:\n';
        cotenantsWithout.forEach((co) => {
          emailContent += `- ${co.CotenantName}\n`;
        });
      }
    }

    if (this.showClientProfile) {
      emailContent +=
        'New Tenant that wish to open on this shopping center: (' +
        this.BuyBoxOrganizationName +
        ')' +
        '\n\n';
    }

    if (this.showMinBuildingSize) {
      emailContent +=
        'The Required Min Unit Size for Lease (' +
        this.buybox?.MinBuildingSize +
        ' Sqft)' +
        '\n';
    }

    if (this.showMinBuildingSize) {
      emailContent +=
        'The Required Max Unit Size for Lease (' +
        this.buybox?.MaxBuildingSize +
        ' Sqft)' +
        '\n\n';
    }

    if (this.showRelationNames) {
      // Get the organization name
      const organizationName =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]?.Name ||
        'No Organization Name';

      // Initialize a map to group relations by category name
      const categoryMap: { [key: string]: string[] } = {};

      // Iterate through selected relations
      this.relationCategoriesNames.forEach((selectedRelation) => {
        if (selectedRelation.selected) {
          this.generated[0]?.Releations?.forEach((relation) => {
            if (
              relation.RetailRelationCategoryId === selectedRelation.id &&
              relation.relationSelect &&
              this.isRelationCategoryMatched(relation)
            ) {
              const categoryName = this.getRelationCategoryName(
                relation.RetailRelationCategoryId
              );

              // Group relation names under their categories
              if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = [];
              }
              categoryMap[categoryName].push(relation.Name);
            }
          });
        }
      });

      // Build the email content
      for (const category in categoryMap) {
        // Add organization name and category
        emailContent += `${organizationName} ${category}\n`;
        // Add the relations under this category
        categoryMap[category].forEach((relationName) => {
          emailContent += `- ${relationName}\n`;
        });
        emailContent += '\n'; // Add spacing between categories
      }
    }

    if (this.showOrganizationManagers) {
      this.managerOrganizations.forEach((manager) => {
        emailContent +=
          this.BuyBoxOrganizationName +
          ` Representative Brokerage Company: ${manager.ManagerOrganizationName}\n\n`;

        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `Broker on Charge Assistant that is sending this email: ${contact.Firstname} ${contact.LastName}\n\n`;

            // if (contact.assistantSelected) {
            //   const assistantEmail = this.generateAssistantEmail(
            //     contact.AssistantName
            //   );
            //   emailContent += `\nEmail Signature:\n`;
            //   emailContent += `Name: ${contact.AssistantName}\n`;
            //   emailContent += `Title: ${contact.Firstname} ${contact.LastName} Assistant\n`;
            //   emailContent += `Email: ${assistantEmail}\n`;
            // }
          }
        });
      });
    }

    if (this.showMangerDescriptionDetails) {
      this.managerOrganizations.forEach((manager) => {
        emailContent += `${manager.ManagerOrganizationName} Description: ${this.MangerDescription}\n`;
      });
    }
  
    if(this.showBuyBoxDescriptionDetails){
      emailContent +=
       this.BuyBoxOrganizationName +' Description: (' +
      this.BuyBoxDescriptionDetails +
      ')' +
      '\n\n';
    }
    if(this.showBuyBoxDescription){
      emailContent +=
       'BuyBox Description: (' +
      this.BuyBoxDescription +
      ')' +
      '\n\n';
    }
    if(this.showShoppingCenterDescription){
      emailContent +=
       this.ShoppingCenterName +' Description: (' +
      this.ShoppingCenterDescriptionText +
      ')' +
      '\n\n';
    }

    this.emailBody = emailContent;
  }

  GenerateEmail() {
    this.spinner.show();
    this.updateEmailBody();
    if (!this.selectedPromptId || !this.emailBody) {
      alert('Please select a prompt and provide an email body');
      this.spinner.hide();
      return;
    }

    const promptId = Number(this.selectedPromptId); // Convert to number
    const context = this.emailBody;
    this.PlacesService.generateEmail(promptId, context).subscribe({
      next: (data: any) => {
        this.emailSubject = data?.emailSubject || 'No subject received';
        this.emailBodyResponse = data?.emailBody || 'No body received';
        this.emailId = data?.id || 'No body received';
        this.spinner.hide();
      },
    });
  }

  UpdateEmailTemplate(email: any) {
    const body = {
      name: 'EditEmailTemplate',
      params: {
        id: email.Id,
        subject: email.Subject,
        template: email.Template,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.emailBodyResponsetogale = false;
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
      },
      error: (err) => {
        console.error('Error updating prompt:', err);
        alert('Failed to update the prompt. Please try again.');
      },
    });
  }

  open(content: any, modalObject?: any) {
    if (this.General) {
      this.General.modalObject = modalObject;
    }
    this.openDialog(content);
  }
  openDialog(content: any, size: string = 'lg') {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: size,
      scrollable: true,
    });
  }

  // prompts to be displayed in select dropdown
  async GetPrompts() {
    this.spinner.show();
    const response = await this.callApi();
    const catagoryId = response.json[0].Id;

    const body: any = {
      Name: 'GetPrompts',
      MainEntity: null,
      params: {
        Id: catagoryId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        const responsePrompts = data?.json || [];
        if (responsePrompts.length > 0) {
          this.prompts = responsePrompts.map((prompt: any) => ({
            id: prompt?.Id || null,
            name: prompt?.Name || 'Unnamed Prompt',
            promptText: prompt?.PromptText || 'No prompt text available',
          }));
          this.spinner.hide();
        } else {
          console.error('No prompts found in the response.');
          this.prompts = [];
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('Error fetching prompts:', err);
        this.prompts = [];
        this.spinner.hide();
      },
    });
  }
  // this 2 async to the previous function
  // Method to call the API
  async callApi(): Promise<any> {
    const url = 'https://api.cherrypick.com/api/GenericAPI/Execute';
    const headers = {
      'Content-Type': 'application/json',
      Cookie:
        'ARRAffinity=0422a4dadbc118f9867df7ce19b008b709e8d292e137797ec5a3992788831d23; ARRAffinitySameSite=0422a4dadbc118f9867df7ce19b008b709e8d292e137797ec5a3992788831d23',
    };
    const body = {
      name: 'GetPromptsCategoryId',
      params: {
        Name: 'Availability',
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    }
  }
  // Method to print the result of the API call
  async printResult(): Promise<void> {
    try {
      const result = await this.callApi();
      // console.log('API Response:', result);
    } catch (error) {
      console.error('Error printing result:', error);
    }
  }
  // when select from select drop down to be changed
  updatePrompt() {
    const selectedPrompt = this.prompts.find(
      (prompt) => prompt.id == this.selectedPromptId
    );
    if (selectedPrompt) {
      this.selectedPromptText =
        selectedPrompt.promptText || 'No prompt text available';
      // console.log('Selected Prompt Text:', this.selectedPromptText);
    } else {
      this.selectedPromptText = 'No prompt text available';
    }
  }
  // Open Modal with Selected Prompt Text
  openPromptTextModal(modal: any) {
    if (
      !this.selectedPromptText ||
      this.selectedPromptText === 'No prompt text available'
    ) {
      alert('No prompt text available to display.');
      return;
    }
    this.modalService.open(modal, { size: 'lg', backdrop: true }); // Enable click outside to close
  }
  openBodyModal(modal: any) {
    if (
      !this.selectedPromptText ||
      this.selectedPromptText === 'No prompt text available'
    ) {
      alert('No prompt text available to display.');
      return;
    }
    this.modalService.open(modal, { size: 'lg', backdrop: true }); // Enable click outside to close
    this.updateEmailBody();
  }
  editPrompt() {
    this.isEditing = true;
    this.editablePromptText = this.selectedPromptText; // Copy current text for editing
  }

  savePrompt(modal: any) {
    if (!this.selectedPromptId) {
      alert('No prompt selected to update.');
      return;
    }
    if (!this.editablePromptText.trim()) {
      alert('Prompt text cannot be empty.');
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
      error: (err) => {
        console.error('Error updating prompt:', err);
        alert('Failed to update the prompt. Please try again.');
      },
    });
  }

  copyEmailBody() {
    const textArea = document.createElement('textarea');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.emailBodyResponse;
    textArea.value = tempDiv.innerText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.showCopiedMessage('body');
  }
  copyEmailSubject() {
    const textArea = document.createElement('textarea');
    textArea.value = this.emailSubject;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.showCopiedMessage('subject');
  }
  showCopiedMessage(type: 'subject' | 'body') {
    if (type === 'subject') {
      this.isSubjectCopied = true;
      setTimeout(() => (this.isSubjectCopied = false), 2000);
    } else {
      this.isBodyCopied = true;
      setTimeout(() => (this.isBodyCopied = false), 2000);
    }
  }
  clearSelections() {
    // Reset selected shopping center and prompt
    this.selectedShoppingCenter = '';
    this.selectedPromptId = ''; // or selectedPromptName = '' depending on how you track prompts

    this.showAllCotenants = false;
    this.showCotenantsWithActivity = false;
    this.showCotenantsWithoutActivity = false;
    this.showManagerName = false;
    this.showClientProfile = false;
    this.showRelationNames = false;
    this.showOrganizationManagers = false;
    this.showMangerDescriptionDetails = false;

    this.emailBody = '';
    // Clear the groupedActivityTypes and other cotenant selections if needed
    this.groupedActivityTypes = [];
    // For without activity cotenants, since no center is selected, they won't appear anyway.
    // If prompts and managers or other data must be reloaded or reset to their initial states, do so here.
    // Update the email body once more to ensure everything is cleared
    // this.updateEmailBody();
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
