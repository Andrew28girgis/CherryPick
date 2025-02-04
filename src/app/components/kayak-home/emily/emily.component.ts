import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Center } from 'src/models/shoppingCenters';
import { NgxSpinnerService } from 'ngx-spinner';


export interface BuyBoxOrganizationsForEmail {
  Id: number
  Name: string
  LogoURL: string
  Contact: BuyBoxOrganizationsForEmailContact[]
}

export interface BuyBoxOrganizationsForEmailContact {
  id: number
  Firstname: string
  Lastname: string
  selected: boolean
  selectedName:string
  ShoppingCenters: Contact_ShoppingCenter[]
}

export interface Contact_ShoppingCenter {
  id: number
  selected: boolean
  centername: string
}


@Component({
  selector: 'app-emily',
  templateUrl: './emily.component.html',
  styleUrls: ['./emily.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }),
        animate('500ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ height: '0px', opacity: 0 }))
      ])
    ])
  ]
})

export class EmilyComponent implements OnInit {
  buyBoxId!: number | null;
  TemplatesId!: number | null;
  General!: any;
  generated: Generated[] = [];
  // generatedGetSavedTemplates: any[] = [];
  relationCategoriesNames: RelationNames[] = [];
  showClientProfile: boolean = false;
  showMinBuildingSize: boolean = false;
  showMaxBuildingSize: boolean = false;
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
  emailId!:number;
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
  generatedGetSavedTemplates:any;
  contactidsJoin :any;
  selectedOrg!:Number;
  tabs = [
    { id: 'Details', label: 'Details' },
    // { id: 'Emily', label: 'Emily' },
    { id: 'Properties', label: 'Properties' },
    // { id: 'Relations', label: 'Relations' },
    // { id: 'Locations', label: 'Locations' },
    // { id: 'Sharing', label: 'Sharing' },
    { id: 'kayak', label: 'kayak' },
  ];
  buybox:any;
  selectedTab: string = 'Details';

  selectedEmailyID: string | null = null;

  isChecked(emailyID: string): boolean {
    return this.selectedEmailyID === emailyID;
  }

  showSelections = true;
  constructor(
    private route: ActivatedRoute,
        private spinner: NgxSpinnerService,
    
    private modalService: NgbModal,
    private PlacesService: PlacesService
  ) {
    console.log(`w`);
    
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;

      this.GetBuyBoxInfo();
      this.GetRetailRelationCategories();
      this.GetPrompts();
      this.GetBuyBoxInfoDetails();
    });
  }

  ngOnInit() {
   setTimeout(() => {
    this.showClientProfile=true;
    this.showRelationNames=true;
    this.showOrganizationManagers=true;
    this.showManagerName=true;
    this.showMangerDescription = true;
    this.showMinBuildingSize=true;
    this.showMaxBuildingSize=true;
    this.onOrganizationManagersChange();
    this.onMangerDescriptionChange();
    this.onCheckboxdetailsChangeMin(true,true);
    // this.onCheckboxdetailsChangeMax(true);
    // this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
    }, 3000); 

    setTimeout(() => {
      this.selectManagerContactsByDefault();
      this.selectManagerTenantsByDefault();
      this.selectedCenter();
    }, 500); 
  }
  
  toggleSelections() {
    this.showSelections = !this.showSelections;
  }

  // onCheckboxChangeTemplates(emailyID: string): void {
  //   if (this.selectedEmailyID === emailyID) {
  //     this.selectedEmailyID = null;
  //     this.emailBody = '';
  //   } else {
  //     this.selectedEmailyID = emailyID;

  //     const selectedTemplate = this.generatedGetSavedTemplates.find(
  //       (template) => template.ID === Number(emailyID)
  //     );

  //     if (selectedTemplate?.BuyboxOrgEmailTemplates?.[0]?.Template) {
  //       const rawText = selectedTemplate.BuyboxOrgEmailTemplates[0].Template;
  //       this.emailBody = this.getFormattedTemplate(rawText);
  //     } else {
  //       this.emailBody = 'No Template Available';
  //     }
  //   }

  //   console.log(emailyID, this.emailBody);
  // }

  getFilteredTabs() {
    return this.tabs.filter(tab => tab.id !== 'kayak');
  }

  handleKayakClick() {
    this.selectTab('Shopping Centers');
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  @Output() contentChange = new EventEmitter<string>();

  getFormattedTextTemplate(text: string): string {
    return text
      .split('\n')
      .join('<br>');
  }

  getFormattedTemplate(text: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      const linkText = link.textContent;
      link.replaceWith(`${linkText} [${href}]`);
    });
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  trackByRelation(index: number, relation: any): number {
    return relation.id;
  }

  onContentChange(event: Event): void {
    const target = event.target as HTMLElement;
    this.contentChange.emit(target.innerHTML);
  }
  
  selectManagerContactsByDefault() {
    this.getManagerContacts(this.selectedShoppingCenter).forEach((contact) => {
      contact.selectedName = true;
    });

    this.onContactCheckboxChange();
    this.updateEmailBody();
  }

  selectedCenter(){
    this.getManagerContacts(this.selectedShoppingCenter).forEach((CenterName) => {
      // CenterName.selectedName = true;
      console.log('CenterName',CenterName);
      
    });
  }

  selectManagerTenantsByDefault() {
    this.managerOrganizations.forEach((manager: any) => {
      manager.ManagerOrganizationContacts.forEach((contact: any) => {
        contact.assistantSelected = true;
      });
    });

    // this.onOrganizationManagersChange();
    this.onAssistantCheckboxChange(this.managerOrganizations);
    this.onContactCheckboxChange();
  }
  
  selectedIndex!: number;
  CheckGetSavedTemplates: any[] = [];
  isEmailSectionVisible: boolean = true;
  // organizationid! : number ;
  selectContact(index: number, organizationId: number) {
    this.selectedIndex = index;
    this.isEmailSectionVisible = !this.isEmailSectionVisible;
  
    if (this.isEmailSectionVisible) {
      this.OnCheckGetSavedTemplates(organizationId);
  } else {
      this.CheckGetSavedTemplates = [];
    }
  }
  
  
  OnCheckGetSavedTemplates(organizationid: number): void {
    // this.ShowSpinner = true;
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
        if (data?.json && Array.isArray(data.json)) {
          this.CheckGetSavedTemplates = data.json;
  
          const selectedTemplate = this.CheckGetSavedTemplates.find(
            (Template) => Template.OrganizationId === Number(organizationid)
          );
  
          if (selectedTemplate?.Template) {
            const rawText = this.getFormattedTemplate(selectedTemplate.Template);
  
            this.emailBody += `\n\n${rawText}`;
            this.spinner.hide();

          } else {
            this.emailBody += `\n\nNo Template Available`;
          }
        } else {
          this.CheckGetSavedTemplates = [];
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('API error:', err);
        this.CheckGetSavedTemplates = [];
      },
    });
  }
  
  selectedShoppingCenterId!: number;

  handleTabChange(event: { tabId: string; shoppingCenterId: number }) {
    // console.log(`hello`);
    
    this.emailSubject = '' ;
    this.emailBodyResponse = ''; 
    this.selectedTab = event.tabId;
    this.selectedShoppingCenterId = event.shoppingCenterId;
    this.GetBuyBoxOrganizationsForEmail();
    this.getShoppingCenters(this.buyBoxId!);
  }

  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  GetBuyBoxOrganizationsForEmail() {
    const body: any = {
      Name: 'GetShoppingCenterManagerContacts',
      MainEntity: null,
      Params: {
        shoppingcenterid: this.selectedShoppingCenterId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.BuyBoxOrganizationsForEmail = data.json;  
          this.BuyBoxOrganizationsForEmail[0].Contact.forEach((c:any)=>{
            c.selected = true; 
            c.ShoppingCenters.forEach((ShoppingCenter:any) => {
              ShoppingCenter.selected = true ;
            });
          })
          
          this.selectedOrg=data.json[0].Id;
 
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        } else {
          this.BuyBoxOrganizationsForEmail = [];
          console.error('Unexpected data format:', data);
        }
        // console.log(this.BuyBoxOrganizationsForEmail);
      },
      error: (err) => {
        console.error('API error:', err);
        this.BuyBoxOrganizationsForEmail = [];
      },
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
          

        this.generated?.[0]?.Releations?.forEach((r) => (r.relationSelect = true));
        //this for to be selected by first shopping center by defaukt
        // if (this.ShoppingCenterNames.length > 0) {
        //   this.selectedShoppingCenter = this.ShoppingCenterNames[0].CenterName;
        // }
        this.updateGroupedActivityTypes();
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
          (S: Center) => S.Id == this.selectedShoppingCenterId
        );
        this.selectedShoppingCenter = this.ShoppingCenterNames.find(
          (center) => center.CenterName === this.shoppingCentersSelected?.CenterName
        )?.CenterName || '';
        this.onSelectedShoppingCenterChange();
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  // GetSavedTemplates() {
  //   const body: any = {
  //     Name: 'GetSavedTemplates',
  //     MainEntity: null,
  //     Params: {
  //       buyboxid: this.buyBoxId,
  //     },
  //     Json: null,
  //   };
  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       this.generatedGetSavedTemplates = data?.json || [];
  //       console.log(this.generatedGetSavedTemplates);


  //       // this.generatedGetSavedTemplates = data.json;
  //       this.ManagerOrganizationName =
  //         this.generatedGetSavedTemplates?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationName;
  //       this.BuyBoxOrganizationName =
  //         this.generatedGetSavedTemplates?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.Name;

  //       const buyBox = this.generatedGetSavedTemplates?.[0]?.Buybox?.[0];
  //       if (buyBox) {
  //         this.ManagerOrganizationName =
  //           buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
  //             ?.ManagerOrganizationName || '';
  //         this.BuyBoxOrganizationName =
  //           buyBox.BuyBoxOrganization?.[0]?.Name || '';
  //       }

  //       this.ShoppingCenterNames =
  //         this.generated?.[0]?.BuyBoxShoppingCenters?.map((center) => ({
  //           CenterName: center.CenterName,
  //           ShoppingCenterManager: center.ShoppingCenterManager || [],
  //           CotenantsWithActivityType: (
  //             center.Cotenants?.filter((co) => co.ActivityType) || []
  //           ).map((co) => ({ ...co, selected: false })),

  //           CotenantsWithoutActivityType:
  //             center.Cotenants?.filter((cotenant) => !cotenant.ActivityType) ||
  //             [],
  //         })) || [];

  //       this.generated?.[0]?.Releations?.forEach((r) => (r.relationSelect = true));

  //       this.updateGroupedActivityTypes();
  //     },
  //   });
  // }

  objectEmailSavedtemplate:any;
  SaveTemplate() {
    this.spinner.show();
    let contactId:any ; 
    this.managerOrganizations[0].ManagerOrganizationContacts.forEach(c=>{
      if (c.selected) {
        contactId = c.ContactId ;
      }
    })
    let contacts =  this.selectedContact.join(`,`)
    const body: any = {
      Name: 'SaveTemplate',
      MainEntity: null,
      Params: {
        organizationid :this.selectedOrg,
        template: this.emailBodyResponse,
        subject: this.emailSubject,
        buyboxid: this.buyBoxId,
        contactid : contactId, //andrew
        contactids: contacts
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Saved successfully!');
        this.objectEmailSavedtemplate = data?.json[0];
        this.expressionEmail = false;
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.isEmailSectionVisible = true
        this.spinner.hide();
      },
    });
  }
  SaveAndSendTemplate(){
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

  SendEmailTemplate(email:any){
    const body = {
      name: 'SendTemplate',
      params: {
        id:email.Id,
      },
    };
    console.log(body);

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        // this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.showToast('Email Send successfully!');
      },
      error: (err) => {
        console.error('Error updating prompt:', err);
        alert('Failed to update the prompt. Please try again.');
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
  // onSelectedShoppingCenterChange() {
  //   if (!this.selectedShoppingCenter) return;
  
  //   this.updateGroupedActivityTypes();
  
  //   // تحديث البيانات الأخرى ذات الصلة
  //   this.showAllCotenants = false;
  //   this.showCotenantsWithActivity = false;
  //   this.showCotenantsWithoutActivity = false;
  
  //   const withoutActivity = this.getCotenantsWithoutActivityType(this.selectedShoppingCenter);
  //   withoutActivity.forEach((co) => (co.selected = false));
  
  //   this.updateEmailBody();
  // }
  
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
  
  // onSelectedShoppingCenterChange() {
  //   if (!this.selectedShoppingCenter) return;
  //   this.updateGroupedActivityTypes();
  //   // Reset all flags
  //   this.showAllCotenants = false;
  //   this.showCotenantsWithActivity = false;
  //   this.showCotenantsWithoutActivity = false;
  //   // Ensure all activities and cotenants start deselected
  //   this.groupedActivityTypes.forEach((activity) => {
  //     activity.selected = false;
  //     activity.Cotenants.forEach((co: any) => (co.selected = false));
  //   });
  //   const withoutActivity = this.getCotenantsWithoutActivityType(
  //     this.selectedShoppingCenter
  //   );
  //   withoutActivity.forEach((co) => (co.selected = false));
  //   this.updateEmailBody();
  // }
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
  getManagerContacts(centerName: any): any[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    ) 
 
    return (
      center?.ShoppingCenterManager?.[0]?.ShoppingCenterManagerContact || []
    );
  }

  getManagerContactsx(centerName: any): any[] {
    
    this.BuyBoxOrganizationsForEmail.forEach(OrganizationsForEmail=>{
      OrganizationsForEmail.Contact
    })

    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    ) 
    console.log(`rr`);
    
    console.log(center?.ShoppingCenterManager?.[0].ShoppingCenterManagerContact);
    
    
    return (
      center?.ShoppingCenterManager?.[0]?.ShoppingCenterManagerContact || []
    );
  }

  emailBodyResponsetogale:boolean=false;

  toggleSwitch(){
    this.emailBodyResponsetogale = !this.emailBodyResponsetogale;
  }

  GetRetailRelationCategories() {
    this.spinner.show();

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
  
  onCheckboxdetailsChangeMin(showMinBuildingSize :any,showMaxBuildingSize:any) {
    if(showMinBuildingSize.target?.showMinBuildingSize && showMaxBuildingSize.target?.showMinBuildingSize ){
      this.updateEmailBody();
    }
    else  {
      showMinBuildingSize.target.showMinBuildingSize=!showMinBuildingSize.target.showMinBuildingSize;
      showMaxBuildingSize.target.showMinBuildingSize=!showMaxBuildingSize.target.showMinBuildingSize;

      this.updateEmailBody();
      }

      // if(){
      //   this.updateEmailBody();
      // }
      // else  {
      //   this.updateEmailBody();
      //   }
  }
  // onCheckboxdetailsChangeMax(showMaxBuildingSize :any) {
    
  // }

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

  onContactCheckboxChange( ) {
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
     next: (data:any) => {
       this.buybox = data.json;
       console.log(this.buybox);
       
     },
     error: (err) => {
       console.error('Error fetching buybox info:', err);
      },
   });
 } 

  selectedContact:number[]=[];

  // textarea 'EmailBody'
  updateEmailBody() { 

    let emailContent = ''; 
    if (this.selectedShoppingCenter) {
      // emailContent += `Shopping Center: ${this.selectedShoppingCenter}\n`;
      emailContent += `Shopping Center Representative Organization: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }
    // Add Manager Description if checkbox is selected
    // if (this.showManagerName) {
    //   emailContent += `Manager Description: ${this.getManagerDescription(
    //     this.selectedShoppingCenter
    //   )}\n`;
    // }
    // Add Manager Contacts if selected
   
    const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact ;

 
    

    if (selectedContacts?.length > 0) {
      this.selectedContact = [];
      emailContent += 'Representative Organization Contacts that will receive this email:\n';
      this.BuyBoxOrganizationsForEmail[0].Contact.forEach((contact) => {
        if (contact.selected) {
          emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
          this.selectedContact.push(contact.id); 
        }
        contact.ShoppingCenters.forEach((sp)=>{
          if(sp.selected){
            emailContent += ` Shopping Center: ${sp.centername} \n `;
          } 
        })
      });      
      emailContent += '\n'; 
      
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
        'New Tenant that wish to open on this shopping center: (' +
        this.BuyBoxOrganizationName +
        ')' +
        '\n\n' ;
        //+this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
        // ?.BuyBoxOrganizationDescription +
        // '\n\n'
      }

    if(this.showMinBuildingSize){
      emailContent +=
        'The Required Min Unit Size for Lease (' +
        this.buybox?.MinBuildingSize + ' Sqft)' +
        '\n' 
    }

    if(this.showMinBuildingSize){
      emailContent +=
        'The Required Max Unit Size for Lease (' +
        this.buybox?.MaxBuildingSize + ' Sqft)' +
        '\n\n' 
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
          ` Representative Brokerage Company: ${manager.ManagerOrganizationName}\n`;

        if (this.showMangerDescription && this.MangerDescription) {
          emailContent += `\n Manager Organization Description: ${this.MangerDescription}\n`;
        }

        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `Broker on Charge Assistant that is sending this email: ${contact.Firstname} ${contact.LastName}\n`;

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
    this.spinner.show();
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
        this.emailId = data?.id || 'No body received';
        // console.log('Email Response:', {
        //   subject: this.emailSubject,
        //   body: this.emailBodyResponse,
        // });
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching generic email:', err);
        this.emailSubject = 'Error fetching email subject';
        this.emailBodyResponse = 'Error fetching email body';
        this.ShowSpinner = false;
      },
    });
  }


  UpdateEmailTemplate(email :any){
    const body = {
      name: 'EditEmailTemplate',
      params: {
        id:email.Id,
        subject: email.Subject,
        template: email.Template,
      },
    }; 
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.emailBodyResponsetogale = false
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
  // editPromptbody() {
  //   this.isEditingBody = true;
  //   this.emailBody = this.emailBody; // Copy current text for editing
  // }
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
