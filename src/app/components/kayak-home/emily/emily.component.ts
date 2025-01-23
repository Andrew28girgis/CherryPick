import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-emily',
  templateUrl: './emily.component.html',
  styleUrls: ['./emily.component.css'],
})
export class EmilyComponent {
  buyBoxId!: number | null;
  TemplatesId!: number | null;
  General!: any;
  generated: Generated[] = [];
  generatedGetSavedTemplates: any[] = [];
  relationCategoriesNames: RelationNames[] = [];
  showClientProfile: boolean = false;
  showMangerDescription: boolean = false;
  clientProfileDescription: string = '';
  MangerDescription: string = '';
  showRelationNames: boolean = false;
  selectedRelations: RelationNames[] = [];
  showOrganizationManagers: boolean = false;
  managerOrganizations: ManagerOrganization[] = [];
  showManagerDescription: boolean = false;
  emailBody: string = '';
  manager: any;
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  selectedShoppingCenter: string = '';
  selectedMangerName: string = '';
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];
  showShoppingCenter: boolean = false;
  showManagerName: boolean = false;
  showCotenantsWithActivity: boolean = false;
  showCotenantsWithoutActivity: boolean = false;
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  selectedPromptName: string = '';
  prompts: any[] = [];
  emailSubject: string = '';
  emailBodyResponse: string = '';
  isEditing: boolean = false;
  editablePromptText: string = '';
  groupedActivityTypes: any[] = [];
  showAllCotenants: boolean = false;
  isSubjectCopied: boolean = false;
  isBodyCopied: boolean = false;
  formGroupTemplate!: FormGroup;

  tabs = [
    { id: 'Details', label: 'Details' },
    { id: 'Emily', label: 'Emily' },
    { id: 'Shopping Centers', label: 'Shopping Centers' },
    { id: 'WorkSpaces', label: 'WorkSpaces' },
    { id: 'Sharing', label: 'Sharing' },

  ];
  
  selectedEmailyID: string | null = null; 

  isChecked(emailyID: string): boolean {
    return this.selectedEmailyID === emailyID;
  }

  onCheckboxChangeTemplates(emailyID: string): void {
    if (this.selectedEmailyID === emailyID) {
      this.selectedEmailyID = null;
    } else {
      this.selectedEmailyID = emailyID;
    }
    console.log(emailyID);
    
  }

  selectedTab: string = 'Emily';

  public text = ``;

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  @Output() contentChange = new EventEmitter<string>();

  getFormattedText(): string {
    return this.text
      .split('\n')
      .join('<br>');
  }

  getFormattedTextTemplate(text: string): string {
    return text
      .split('\n')
      .join('<br>');
  }

  onContentChange(event: Event): void {
    const target = event.target as HTMLElement;
    this.contentChange.emit(target.innerHTML);
  }

  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private PlacesService: PlacesService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });
    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetPrompts();
    this.GetSavedTemplates();
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
        this.generated = data.json;
        // console.log('ALL', this.generated);

        this.ManagerOrganizationName =
          this.generated[0].Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationName;
        this.BuyBoxOrganizationName =
          this.generated[0].Buybox[0].BuyBoxOrganization[0].Name;

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

        this.generated[0]?.Releations.forEach((r) => (r.relationSelect = true));
        //this for to be selected by first shopping center by defaukt
        // if (this.ShoppingCenterNames.length > 0) {
        //   this.selectedShoppingCenter = this.ShoppingCenterNames[0].CenterName;
        // }
        this.updateGroupedActivityTypes();
      },
    });
  }

  GetSavedTemplates() {
    const body: any = {
      Name: 'GetSavedTemplates',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.generatedGetSavedTemplates = data.json;
        console.log('ALL GetSavedTemplates', this.generatedGetSavedTemplates);

        this.ManagerOrganizationName =
          this.generatedGetSavedTemplates[0].Buybox[0]?.BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationName;
        this.BuyBoxOrganizationName =
          this.generatedGetSavedTemplates[0].Buybox[0].BuyBoxOrganization[0].Name;

        const buyBox = this.generatedGetSavedTemplates?.[0]?.Buybox?.[0];
        if (buyBox) {
          this.ManagerOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
              ?.ManagerOrganizationName || '';
          this.BuyBoxOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.Name || '';
        }

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

        this.generated[0]?.Releations.forEach((r) => (r.relationSelect = true));

        this.updateGroupedActivityTypes();
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
    // console.log('Grouped ActivityTypes:', this.groupedActivityTypes);
    return center ? this.groupedActivityTypes : [];
  }

  getCotenantsWithoutActivityType(centerName: string): Cotenant[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center ? center.CotenantsWithoutActivityType : [];
  }
  // Called when the selectedShoppingCenter changes (e.g., dropdown selection changes)
  onSelectedShoppingCenterChange() {
    if (!this.selectedShoppingCenter) return;
    this.updateGroupedActivityTypes();
    // Reset all flags
    this.showAllCotenants = false;
    this.showCotenantsWithActivity = false;
    this.showCotenantsWithoutActivity = false;
    // Ensure all activities and cotenants start deselected
    this.groupedActivityTypes.forEach((activity) => {
      activity.selected = false;
      activity.Cotenants.forEach((co: any) => (co.selected = false));
    });
    const withoutActivity = this.getCotenantsWithoutActivityType(
      this.selectedShoppingCenter
    );
    withoutActivity.forEach((co) => (co.selected = false));
    this.updateEmailBody();
  }
  // After GetBuyBoxInfo, once selectedShoppingCenter is known, call this to populate groupedActivityTypes:
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
    // console.log('Updated groupedActivityTypes:', this.groupedActivityTypes);
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
  getManagerContacts(centerName: string): any[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return (
      center?.ShoppingCenterManager?.[0]?.ShoppingCenterManagerContact || []
    );
  }

  GetRetailRelationCategories() {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      MainEntity: null,
      Params: {
        buyboxid: 85,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.relationCategoriesNames = data.json;
        this.relationCategoriesNames.forEach((r) => (r.selected = true));
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
    this.updateEmailBody();
  }

  onMangerDescriptionChange() {
    if (this.showMangerDescription) {
      // Set the manager description
      this.MangerDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';

      // Ensure "David Dochter" and "Assistant" checkboxes are selected
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = true; // Select the manager checkbox
          if (contact.AssistantName) {
            contact.assistantSelected = true; // Select the assistant checkbox
          }
        });
      });
    } else {
      // Clear the manager description and deselect checkboxes
      this.MangerDescription = '';
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = false; // Deselect the manager checkbox
          contact.assistantSelected = false; // Deselect the assistant checkbox
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
  onOrganizationManagersChange() {
    if (this.showOrganizationManagers) {
      this.loadManagerOrganizations();
      this.showMangerDescription = true;
    } else {
      this.managerOrganizations = []; // Clear the data when unchecked
    }
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
  //checkbox select 'Description' and update in textarea
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

  // textarea 'EmailBody'
  updateEmailBody() {
    let emailContent = '';
    // Add Shopping Center and Manager Name
    if (this.selectedShoppingCenter) {
      emailContent += `Shopping Center: ${this.selectedShoppingCenter}\n`;
      emailContent += `Manager: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }
    // Add Manager Description if checkbox is selected
    if (this.showManagerName) {
      emailContent += `Manager Description: ${this.getManagerDescription(
        this.selectedShoppingCenter
      )}\n`;
    }
    // Add Manager Contacts if selected
    const selectedContacts = this.getManagerContacts(
      this.selectedShoppingCenter
    ).filter(
      (contact) =>
        contact.selectedName ||
        contact.selectedFormattedCellPhone ||
        contact.selectedCellPhone ||
        contact.selectedEmail
    );

    if (selectedContacts.length > 0) {
      emailContent += 'Manager Contacts:\n';
      selectedContacts.forEach((contact) => {
        if (contact.selectedName) {
          emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n`;
        }
      });
    }

    // Display selected cotenants with activity if showCotenantsWithActivity is true
    if (this.showCotenantsWithActivity) {
      // Check if there's at least one selected cotenant in any activity
      const anySelected = this.groupedActivityTypes.some((activity: any) =>
        activity.Cotenants.some((co: any) => co.selected)
      );

      if (anySelected) {
        emailContent += 'Cotenants in the shopping center:\n';
        // Iterate over each activity group
        this.groupedActivityTypes.forEach((activity) => {
          // Filter to get only the selected cotenants in this activity
          const selectedCotenants = activity.Cotenants.filter(
            (co: any) => co.selected
          );
          if (selectedCotenants.length > 0) {
            // Print the activity type as a heading
            emailContent += `${activity.ActivityType}:\n`;
            // Print each selected cotenant under this activity
            selectedCotenants.forEach((co: any) => {
              emailContent += `- ${co.CotenantName}\n`;
            });
          }
        });
        emailContent += '\n'; // Add a spacing line after all activities
      }
    }
    // Handle Cotenants without Activity
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
        'New Tenant (' +
        this.BuyBoxOrganizationName +
        ')' +
        '\n' +
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription +
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
          this.generated[0]?.Releations.forEach((relation) => {
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
          ` Representative Brokerage Company: ${manager.ManagerOrganizationName}\n`;

        if (this.showMangerDescription && this.MangerDescription) {
          emailContent += `\n Manager Organization Description: ${this.MangerDescription}\n`;
        }

        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `Broker on Charge: ${contact.Firstname} ${contact.LastName}\n`;

            if (contact.assistantSelected) {
              const assistantEmail = this.generateAssistantEmail(
                contact.AssistantName
              );
              emailContent += `\nEmail Signature:\n`;
              emailContent += `Name: ${contact.AssistantName}\n`;
              emailContent += `Title: ${contact.Firstname} ${contact.LastName} Assistant\n`;
              emailContent += `Email: ${assistantEmail}\n`;
            }
          }
        });
      });
    }

    this.emailBody = emailContent; // Update the email body
  }
  // send 'EmailBody' and 'promptId' to AI and store Response
  getGenericEmail() {
    // Check if a shopping center is selected
    if (!this.selectedShoppingCenter) {
      alert('Please select a shopping center before generating the email.');
      return;
    }

    // Check if a prompt and email body are provided
    if (!this.selectedPromptId || !this.emailBody) {
      alert('Please select a prompt and provide an email body.');
      return;
    }
    const promptId = Number(this.selectedPromptId); // Convert to number
    const context = this.emailBody;

    this.PlacesService.generateEmail(promptId, context).subscribe({
      next: (data: any) => {
        this.emailSubject = data?.emailSubject || 'No subject received';
        this.emailBodyResponse = data?.emailBody || 'No body received';
        // console.log('Email Response:', {
        //   subject: this.emailSubject,
        //   body: this.emailBodyResponse,
        // });
      },
      error: (err) => {
        console.error('Error fetching generic email:', err);
        this.emailSubject = 'Error fetching email subject';
        this.emailBodyResponse = 'Error fetching email body';
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
          // console.log(`prompets`);
          // console.log(this.prompts);
        } else {
          console.error('No prompts found in the response.');
          this.prompts = [];
        }
        // console.log('Prompts:', this.prompts);
      },
      error: (err) => {
        console.error('Error fetching prompts:', err);
        this.prompts = [];
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
      this.selectedPromptName =
        selectedPrompt.name || 'No prompt Name available';
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

  editPrompt() {
    this.isEditing = true;
    this.editablePromptText = this.selectedPromptText; // Copy current text for editing
  }
  // Save Updated Prompt
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
        // console.log('Prompt updated successfully:', response);
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

    this.emailBody = '';
    // Clear the groupedActivityTypes and other cotenant selections if needed
    this.groupedActivityTypes = [];
    // For without activity cotenants, since no center is selected, they won't appear anyway.
    // If prompts and managers or other data must be reloaded or reset to their initial states, do so here.
    // Update the email body once more to ensure everything is cleared
    // this.updateEmailBody();
  }
}
