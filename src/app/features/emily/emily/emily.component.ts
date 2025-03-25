import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  Cotenant,
  Generated,
  ManagerOrganization,
  ShoppingCenterManager,
} from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';
import { EditorModule } from 'primeng/editor';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Location } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-emily',
  templateUrl: './emily.component.html',
  styleUrls: ['./emily.component.css'],
  standalone: true, // Add this line
  imports: [
    CommonModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    EditorModule,
    FormsModule,
    RouterModule,
  ],
  providers: [NgxSpinnerService, PlacesService],
})
export class EmilyComponent implements OnInit {
  @Output() contentChange = new EventEmitter<string>();
  buyBoxId!: any;
  orgId!: any;
  CenterId!: any;
  showMoreRelations: { [key: number]: boolean } = {};
  General!: any;
  generated: Generated[] = [];
  relationCategoriesNames: RelationNames[] = [];
  showClientProfile: boolean = false;
  showMinBuildingSize: boolean = false;
  showMaxBuildingSize: boolean = false;
  showMangerDescription: boolean = false;
  showMangerDescriptionDetails: boolean = false;
  showMangerContactSignature: boolean = false;
  showBuyBoxDescriptionDetails: boolean = false;
  showShoppingCenterDescription: boolean = false;
  showBuyBoxDescription: boolean = false;
  clientProfileDescription: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  ShoppingCenterDescription: any;
  MangerDescription: string = '';
  MangerSignature: string = '';
  showRelationNames: boolean = false;
  selectedRelations: RelationNames[] = [];
  showOrganizationManagers: boolean = false;
  managerOrganizations: ManagerOrganization[] = [];
  emailBody: string = '';
  manager: any;
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  selectedShoppingCenter: string = '';
  showShoppingCenter: boolean = false;
  showCotenantsWithActivity: boolean = false;
  showCotenantsWithoutActivity: boolean = false;
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  selectedPromptName: string = '';
  prompts: any[] = [];
  emailSubject: string = '';
  emailBodyResponse: any;
  emailId!: number;
  isEditing: boolean = false;
  isEditingBody: boolean = false;
  editablePromptText: string = '';
  groupedActivityTypes: any[] = [];
  showAllCotenants: boolean = false;
  isSubjectCopied: boolean = false;
  isBodyCopied: boolean = false;
  expressionEmail: boolean = true;
  shoppingCenters: Center[] = [];
  shoppingCentersSelected: Center | undefined = undefined;
  buybox: any;
  shoppingCenterOrganization!: number;
  CheckGetSavedTemplates: any[] = [];
  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];
  ShoppingCenterDescriptionText: any;
  ShoppingCenterName: any;
  ShoppingCenterNameText: any;
  newPromptText: string = '';
  newPromptName: string = '';
  selectedContactId: number = 0;
  emailBodyResponsetogale: boolean = false;
  objectEmailSavedtemplate: any;
  selectedContact: number[] = [];
  RepresentativeOrganizationContactsThatWillReceiveThisEmail: string =
    'Representative Organization Contacts that will receive this email:';
  contactId: any;
  @Input() buyBoxIdReply!: number;
  @Input() orgIdReply!: number;
  @Input() emailBodyReply!: any;
  @Input() selectedContactContactId!: any;
  loginContact: any;
  @Output() emailBodyResponseSend: EventEmitter<any> = new EventEmitter<any>();
  @Input() modal: any;
  microDealId: any;
  closeModal() {
    this.modal.dismiss('Close click');
  }

  formGroup!: FormGroup;
  bodyemail: any;
  contactIdemail: any;
  isLandingSelected: boolean = false;
  isISCcSelected: boolean = false;
  GenerateEmailall: any;

  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private _location: Location
  ) {
    if (!this.buyBoxIdReply) {
      this.route.paramMap.subscribe((params) => {
        this.buyBoxId = params.get('buyboxId');
        this.orgId = params.get('orgId');
        this.microDealId = params.get('microDealId');
        this.CenterId = params.get('CenterId');
        this.shoppingCenterOrganization = this.orgId;
      });
    }
  }

  async ngOnInit() {
    this.spinner.show();
    this.loginContact = localStorage.getItem('contactId');
    this.contactId = localStorage.getItem('contactId');

    if (this.buyBoxIdReply && this.orgIdReply) {
      this.buyBoxId = this.buyBoxIdReply;
      this.orgId = this.orgIdReply;
      this.shoppingCenterOrganization = this.orgId;
    }

    this.formGroup = new FormGroup({
      body: new FormControl(''),
      subject: new FormControl(''),
      IsCC: new FormControl(false),
      includinglanding: new FormControl(false),
    });

    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetPrompts();
    this.GetBuyBoxInfoDetails();
    this.GetBuyBoxOrganizationsForEmail();
    this.spinner.hide();
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
        this.showMinBuildingSize = true;
        this.showMaxBuildingSize = true;
        this.onCheckboxdetailsChangeMin(true, true);
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
        this.selectManagerContactsByDefault();
        this.onSelectedShoppingCenterChange();
        this.spinner.hide();
      },
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
    this.showMangerDescription = true;
    this.onMangerDescriptionChange();
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
          this.spinner.hide();
        }
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
        this.spinner.hide();
      },
    });
  }

  SaveTemplate(emailItem: any) {
    this.spinner.show();
    let contactId: any;
    this.managerOrganizations[0].ManagerOrganizationContacts.forEach((c) => {
      if (c.selected) {
        contactId = c.ContactId;
      }
    });
    let contacts = emailItem.recieverIds.join(',');

    if (this.emailBodyReply) {
      var body: any = {
        Name: 'SaveTemplate',
        MainEntity: null,
        Params: {
          // organizationid: this.shoppingCenterOrganization,
          Body: this.emailBodyResponse,
          subject: this.emailSubject,
          buyboxid: this.buyBoxId,
          contactid: contactId,
          contactids: contacts,
        },
        Json: null,
      };
    } else {
      var body: any = {
        Name: 'SaveTemplate',
        MainEntity: null,
        Params: {
          // organizationid: this.shoppingCenterOrganization,
          Body: emailItem.emailBody,
          subject: emailItem.emailSubject,
          buyboxid: this.buyBoxId,
          contactid: contactId,
          contactids: contacts,
        },
        Json: null,
      };
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Saved successfully!');
        this.objectEmailSavedtemplate = data?.json[0];
        this.GenerateEmailall = this.GenerateEmailall.filter(
          (item: any) => item !== emailItem
        );
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.spinner.hide();
      },
    });
  }

  SaveAndSendTemplate(recieverIds?: any) {
    this.SaveTemplate(recieverIds);
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
          this.MoveStage();
        },
      });
    }, 2000);
  }

  MoveStage() {
    const body = {
      name: 'ChangeDealStage',
      params: {
        stageid: 8,
        microdealid: this.microDealId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {},
    });
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

    this.onCotenantsWithActivityChange();
    this.onCotenantsWithoutActivityChange();
  }

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
      const cotenants = this.getCotenantsWithActivityType(
        this.selectedShoppingCenter
      );
      cotenants.forEach((cotenant) => {
        cotenant.selected = this.showCotenantsWithActivity;
      });
      this.groupedActivityTypes.forEach((activity) => {
        activity.selected = this.showCotenantsWithActivity;
        activity.Cotenants.forEach((cotenant: any) => {
          cotenant.selected = this.showCotenantsWithActivity;
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
    this.updateEmailBody();
  }

  selectAllCotenantsForActivity(activity: any) {
    activity.Cotenants.forEach((cotenant: any) => {
      cotenant.selected = activity.selected;
    });
    const anyActivitySelected = this.groupedActivityTypes.some(
      (act) => act.selected
    );
    this.showCotenantsWithActivity = anyActivitySelected;
    this.updateEmailBody();
  }

  getManagerName(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center?.ShoppingCenterManager?.[0]?.Name || 'No Manager';
  }

  getManagerDescription(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return (
      center?.ShoppingCenterManager?.[0]?.Description ||
      'No description available'
    );
  }

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
        this.relationCategoriesNames?.forEach((r) => (r.selected = true));
        this.spinner.hide();
      },
    });
  }

  onCheckboxChange() {
    if (this.showMangerDescription) {
      this.clientProfileDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription || '';
      this.RepresentativeOrganizationContactsThatWillReceiveThisEmail =
        'Representative Organization Contacts that will receive this email:';
    } else {
      this.clientProfileDescription = '';
    }
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

  onCheckShoppingCenterDescriptionChange() {
    if (this.showShoppingCenterDescription) {
      if (this.generated?.[0]?.BuyBoxShoppingCenters) {
        this.ShoppingCenterDescription =
          this.generated[0].BuyBoxShoppingCenters.find(
            (center) => Number(center.ID) === Number(this.CenterId)
          );
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
    } else {
      this.managerOrganizations = [];
      this.spinner.hide();
    }
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

  onRelationNamesChange() {
    this.relationCategoriesNames.forEach((relation) => {
      if (relation.selected) {
        this.generated[0]?.Releations.forEach((item) => {
          if (item.RetailRelationCategoryId === relation.id) {
            item.relationSelect = true;
          }
        });
      } else {
        this.generated[0]?.Releations.forEach((item) => {
          if (item.RetailRelationCategoryId === relation.id) {
            item.relationSelect = false;
          }
        });
      }
    });
    this.updateSelectedRelations();
    this.updateEmailBody();
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

  onContactCheckboxChange() {
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

  generateAssistantEmail(assistantName: string): string {
    if (!assistantName) return '';
    return assistantName.toLowerCase().replace(/\s+/g, '') + '@cherrypick.com';
  }

  onAssistantCheckboxChange(contact: any) {
    if (!contact.assistantSelected) {
      contact.selectedAssistantName = false;
    }
    this.updateEmailBody();
  }

  updateEmailBody() {
    let emailContent = '';
    if (this.selectedShoppingCenter) {
      emailContent += `Shopping Center Representative Organization: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }

    const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact;

    const countSelectedContacts = this.selectedContact.length;
    if (selectedContacts?.length > 0) {
      this.selectedContact = [];

      emailContent += `${this.RepresentativeOrganizationContactsThatWillReceiveThisEmail}\n`;
      if (this.emailBodyReply) {
        if (this.formGroup.get('IsCC')?.value == false) {
          emailContent += `- Create ${countSelectedContacts} Email For each Contact and shopping Center\n `;
        }
      } else {
        if (this.isISCcSelected == false) {
          emailContent += `- Create ${countSelectedContacts} Email For each Contact and shopping Center\n `;
        }
      }

      this.BuyBoxOrganizationsForEmail[0].Contact.forEach((contact) => {
        if (contact.selected && contact?.Centers?.length > 0) {
          // if (this.isISCcSelected === false) {
          //   emailContent += `- Name: #name#\n `;
          //   this.selectedContact.push(contact.id);
          // } else {
          emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
          emailContent += `- id: ${contact.id}\n `;
          this.selectedContact.push(contact.id);
          // }
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
      const organizationName =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]?.Name ||
        'No Organization Name';

      const categoryMap: { [key: string]: string[] } = {};
      this.relationCategoriesNames?.forEach((selectedRelation) => {
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

    if (this.showBuyBoxDescriptionDetails) {
      emailContent +=
        this.BuyBoxOrganizationName +
        ' Description: (' +
        this.BuyBoxDescriptionDetails +
        ')' +
        '\n\n';
    }

    if (this.showBuyBoxDescription) {
      emailContent +=
        'BuyBox Description: (' + this.BuyBoxDescription + ')' + '\n\n';
    }

    if (this.showShoppingCenterDescription) {
      emailContent +=
        this.ShoppingCenterName +
        ' Description: (' +
        this.ShoppingCenterDescriptionText +
        ')' +
        '\n\n';
    }

    if (this.showMangerContactSignature) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `\nUse This Email Signature:\n`;
            // emailContent += `Title: ${contact.Firstname} ${contact.LastName} Assistant\n`;
            emailContent += `${contact.EmailSignature}\n\n`;
          }
        });
      });
    }

    if (this.emailBodyReply) {
      emailContent += `Reply to this email`;
      emailContent += this.emailBodyReply;
    }

    if (this.emailBodyReply) {
      if (this.isLandingSelected) {
        const landingLink =
          'https://cp.cherrypick.com/tenant/' + this.buyBoxIdReply;
        emailContent += `\nLanding page: <a href="${landingLink}">${landingLink}</a>`;
      }
    } else {
      if (this.isLandingSelected) {
        const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
        emailContent += `\nLanding page: <a href="${landingLink}">${landingLink}</a>`;
      }
    }

    this.emailBody = emailContent;
  }

  GenerateEmail() {
    this.spinner.show();

    this.updateEmailBody();
    if (!this.selectedPromptId || !this.emailBody) {
      this.showToast('Please select a prompt to Generate.');
      this.spinner.hide();
      return;
    }
    if (this.emailBodyReply) {
      const landingLink =
        'https://cp.cherrypick.com/tenant/' + this.buyBoxIdReply;
      var landingSnippet = '';
      if (this.isLandingSelected) {
        landingSnippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
      }
    } else {
      const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
      landingSnippet = '';
      if (this.isLandingSelected) {
        landingSnippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
      }
    }

    const promptId = Number(this.selectedPromptId);
    const context = this.emailBody;
    if (this.emailBodyReply) {
      var OrganizaitonsId = [this.orgIdReply];
    } else {
      OrganizaitonsId = [Number(this.orgId)];
    }
    if (this.emailBodyReply) {
      var IsCC = this.formGroup.get('IsCC')?.value;
    } else {
      IsCC = this.isISCcSelected;
    }

    this.PlacesService.generateEmail(
      promptId,
      context,
      OrganizaitonsId,
      IsCC
    ).subscribe({
      next: (data: any) => {
        // console.log(data);
        this.GenerateEmailall = data;

        this.emailSubject = data?.emailSubject || 'No subject received';
        let generatedBody = data?.emailBody || '';

        this.emailBodyResponse = generatedBody;

        if (this.isLandingSelected) {
          this.emailBodyResponse += landingSnippet;
        }

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

  GetPrompts() {
    this.spinner.show();
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
          this.spinner.hide();
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
            this.spinner.hide();
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

  openBodyModal(modal: any) {
    this.modalService.open(modal, { size: 'lg', backdrop: true });
    this.updateEmailBody();
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

  openAddPrompt(modal: any) {
    this.modalService.open(modal, { size: 'lg', backdrop: true });
  }

  addPrompt(modal: any) {
    if (!this.newPromptText.trim() || !this.newPromptName.trim()) {
      this.showToast('Prompt text cannot be empty.');
      return;
    }
    const body = {
      name: 'AddPrompt',
      params: {
        promptText: this.newPromptText,
        promptName: this.newPromptName,
        contactId: this.selectedContactId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.showToast('Prompt added successfully!');
        modal.close();
        this.GetPrompts();
        this.newPromptText = '';
        this.newPromptName = '';
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
    this.selectedShoppingCenter = '';
    this.selectedPromptId = '';
    this.showAllCotenants = false;
    this.showCotenantsWithActivity = false;
    this.showCotenantsWithoutActivity = false;
    this.showClientProfile = false;
    this.showRelationNames = false;
    this.showOrganizationManagers = false;
    this.showMangerDescriptionDetails = false;
    this.showMinBuildingSize = false;
    this.showMaxBuildingSize = false;
    this.showBuyBoxDescription = false;
    this.showBuyBoxDescriptionDetails = false;
    this.showShoppingCenterDescription = false;
    this.RepresentativeOrganizationContactsThatWillReceiveThisEmail = '';
    this.BuyBoxOrganizationsForEmail[0].Contact.forEach((c: any) => {
      c.selected = false;
      c.Centers?.forEach((ShoppingCenter: any) => {
        ShoppingCenter.selected = false;
      });
    });
    this.managerOrganizations.forEach((manager) => {
      manager.ManagerOrganizationContacts.forEach((contact) => {
        contact.selected = false;
      });
    });
    this.emailBody = '';
    this.groupedActivityTypes = [];
    this.isISCcSelected = false;
    this.isLandingSelected = false;
    this.formGroup.get('IsCC')?.setValue(false);
    this.formGroup.get('includinglanding')?.setValue(false);
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

  AddEmail() {
    this.spinner.show();

    const body: any = {
      Name: 'AddEmail',
      MainEntity: null,
      Params: {
        Body: this.formGroup.get('body')?.value + this.emailBodyReply, // this.bodyemail      abl kda de
        Date: new Date().toISOString(),
        Subject: this.formGroup.get('subject')?.value,
        Direction: Number(-1),
        outbox: '',
        BuyBoxId: +this.buyBoxId,
        IsCC: this.formGroup.get('IsCC')?.value ? 1 : 0,
        FromContactId: Number(this.loginContact),
        ContactIds: this.selectedContactContactId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.closeModal();
      },
    });
  }

  onIncludeLandingChange(event: any): void {
    this.isLandingSelected = event.target.checked;

    if (this.emailBodyReply) {
      const landingLink =
        'https://cp.cherrypick.com/tenant/' + this.buyBoxIdReply;

      if (!this.emailBodyResponse) {
        this.emailBodyResponse = '';
      }

      if (event.target.checked) {
        if (!this.emailBodyResponse.includes(landingLink)) {
          this.emailBodyResponse += `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
        }
      } else {
        const snippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
        this.emailBodyResponse = this.emailBodyResponse.replace(snippet, '');
      }
    } else {
      const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;

      if (!this.emailBody) {
        this.emailBody = '';
      }
      if (event.target.checked) {
        if (!this.emailBody.includes(landingLink)) {
          this.emailBody += `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
        }
      } else {
        const snippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
        this.emailBody = this.emailBody.replace(snippet, '');
      }
    }
  }

  onISCCChange(event: any): void {
    this.isISCcSelected = event.target.checked;
  }

  back() {
    this._location.back();
  }
}
