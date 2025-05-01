import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import {
  AvailabilityTenant,
  IFile,
  jsonGPT,
} from 'src/app/shared/models/manage-prop';
import {
  Tenant,
  Availability,
} from 'src/app/shared/models/manage-prop-shoppingCenter';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  HttpClient,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgxFileDropModule } from 'ngx-file-drop';
import { PlacesService } from 'src/app/core/services/places.service';
import { OrganizationBranches } from 'src/app/shared/models/organization-branches';
import { LandingPageTenants } from 'src/app/shared/models/landing-page-tenants';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { ICustomPolygon } from 'src/app/shared/models/custom-polygon.model';
import { TenantShoppingCenter } from 'src/app/shared/models/tenantShoppingCenter';
import { PropertiesDetails } from 'src/app/shared/models/manage-prop-shoppingCenter';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { organizationContacts } from 'src/app/shared/models/organizationContacts';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import {
  Bb,
  C,
  MatchCampaignFromSubmission,
  P,
} from 'src/app/shared/models/MatchCampaignFromSubmission';
import { MapDrawingService } from 'src/app/core/services/map-drawing.service';
@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    RouterModule,
    FormsModule,
    NgxFileDropModule,
    NgbPopoverModule,
  ],
  providers: [],
  templateUrl: './tenant.component.html',
  styleUrl: './tenant.component.css',
})
export class TenantComponent implements OnInit, AfterViewInit {
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
  @ViewChild('emailModal', { static: true }) emailModal!: TemplateRef<any>;
  @ViewChild('contactDataModal', { static: true })
  contactDataModal!: TemplateRef<any>;
  email: string = '';
  public files: NgxFileDropEntry[] = [];
  selectedShoppingID!: string | undefined;
  JsonPDF!: jsonGPT;
  AvailabilityAndTenants: AvailabilityTenant = {};
  fileName!: string;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isConverting: boolean = false;
  images: IFile[] = [];
  pdfFileName: string = '';
  contactID!: any;
  contactIDs!: any;
  TenantResult!: LandingPageTenants;
  organizationBranches!: OrganizationBranches;
  selectedbuyBox!: string;
  isSubmitting: boolean = false;
  returnsubmit: boolean = false;
  organizationid!: number;
  isFileUploaded: boolean = false;
  isClearing: boolean = false;
  uploadRequest: any;
  selectedCampaign!: number;
  CampaignData!: any;
  showFullReason: boolean = false;
  guid!: string;
  removeavailable: boolean = false;
  removetenant: boolean = false;
  userSubmission: any;
  jsonGUID!: string;
  showAddAvailabilityInput = false;
  newAvailabilitySize: number | undefined;
  showAddTenantInput = false;
  newTenantName = '';
  shoppingCenterManage: TenantShoppingCenter[] = [];
  shoppingCenterManageSubmitted: TenantShoppingCenter[] = [];
  Polgons!: any[];
  OrganizationContacts: organizationContacts[] = [];
  customPolygons: ICustomPolygon[] = [];
  map!: google.maps.Map;
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;
  @ViewChild('openShopping', { static: true }) openShopping!: TemplateRef<any>;
  @ViewChild('deletePlaceModal', { static: true })
  deletePlaceModal!: TemplateRef<any>;
  ShoppingID!: number;
  CustomPlace!: PropertiesDetails | undefined;
  newUrlTenant: string = '';
  newNameTenant = '';
  showAddPlaceInput: boolean = false;
  editingPlaceId: number | null = null;
  showEditInput: boolean = false;
  editedPlaceSqFT!: number;
  newPlaceSqFT!: number;
  deleteType: string = '';
  deleteId: number | null = null;
  showButtons: boolean = true;
  @ViewChild('leasePricesModal') leasePricesModal: TemplateRef<any> | undefined;
  @ViewChild('buildingSizesModal') buildingSizesModal:
    | TemplateRef<any>
    | undefined;
  filteredLeasePlacesManage: any[] = [];
  allBuildingSizes: any[] = [];
  @ViewChild('buildingSizesSubmissionModal') buildingSizesSubmissionModal:
    | TemplateRef<any>
    | undefined;
  modalPlaces: any[] = [];
  @ViewChild('leasePricesSubmissionModal') leasePricesSubmissionModal:
    | TemplateRef<any>
    | undefined;
  modalLeasePlaces: any[] = [];

  private key = CryptoJS.enc.Utf8.parse('YourSecretKey123YourSecretKey123');
  private iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  ContactData: any[] = [];
  MatchCampaignsFromSubmission: MatchCampaignFromSubmission | null = null;
  isManager: boolean = true;
  onlyUpdate: boolean = false;
  selectedOption: string = 'isManager'; // This will control the radio button selection
  selectedCampaignIds: number[] = [];
  selectedPlaces: { [campaignId: number]: number[] } = {};
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    private mapDrawingService: MapDrawingService,
    private shoppingCenterService: ViewManagerService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.userSubmission = params.get('userSubmission');
      let encryptedContactId = params.get('contactId');
      console.log('encryptedContactId (before merge)', encryptedContactId);
      // Check if the last segment is a number or string
      if (this.userSubmission && isNaN(Number(this.userSubmission))) {
        // If userSubmission is a string, merge it with encryptedContactId
        encryptedContactId = `${encryptedContactId}/${this.userSubmission}`;
        console.log('encryptedContactId (after merge)', encryptedContactId);
        this.userSubmission = null; // Reset userSubmission to null
      }
      const parsedId = Number(encryptedContactId);
      console.log('parsedId', parsedId);
      // If parsedId is a number, assign it to contactID
      if (!isNaN(parsedId)) {
        this.contactID = parsedId;
        console.log('Contact ID is a number:', this.contactID);
      }
      // Retrieve the guid
      this.activatedRoute.params.subscribe((params) => {
        this.guid = params['guid'];
        console.log('GUID:', this.guid);
        console.log('userSubmission', this.userSubmission);
        console.log('contactID', this.contactID);
      });
      // Decrypt contact ID if available
      if (encryptedContactId) {
        try {
          this.contactIDs = this.decrypt(encryptedContactId);
          console.log('Decrypted Contact IDs:', this.contactIDs);
        } catch (err) {
          console.error('Decryption failed', err);
        }
      }
    });

    const guid = crypto.randomUUID();
    this.selectedShoppingID = guid;
    if (this.contactIDs) {
      this.GetContactData();
      // this.opencontactDataModal();
    }

    this.GetCampaignFromGuid();
    this.proceedWithNextSteps();
    const storedMgr = localStorage.getItem('isManager');
    this.isManager = storedMgr !== null ? JSON.parse(storedMgr) : true;
    const storedUpd = localStorage.getItem('onlyUpdate');
    this.onlyUpdate = storedUpd !== null ? JSON.parse(storedUpd) : false;
    // Default the selectedOption to 'isManager' initially
    this.selectedOption = this.isManager ? 'isManager' : 'onlyUpdate';
    // console.log('Is Manager:', this.isManager);
    // console.log('Only Update:', this.onlyUpdate);
    if (this.userSubmission) {
      this.GetMatchCampaignsFromSubmission();
    }
  }
  encrypt(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value),
      this.key,
      {
        keySize: 256 / 8,
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encodeURIComponent(encrypted.toString()); // Important: encode here
  }
  decrypt(encryptedValue: string): string {
    const decodedValue = decodeURIComponent(encryptedValue); // Important: decode first
    const decrypted = CryptoJS.AES.decrypt(decodedValue, this.key, {
      keySize: 256 / 8,
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
  GetContactData() {
    const body: any = {
      Name: 'GetContactData',
      Params: {
        ContactIds: this.contactIDs,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.ContactData = res.json;
        // console.log('this.ContactData', this.ContactData);
        // this.opencontactDataModal();

        // this.GetBuyBoxInfo();
        // this.GetGeoJsonFromBuyBox();
      },
    });
  }
  updateRoleSelection(): void {
    if (this.selectedOption === 'isManager') {
      this.isManager = true;
      this.onlyUpdate = false;
    } else if (this.selectedOption === 'onlyUpdate') {
      this.isManager = false;
      this.onlyUpdate = true;
    }
    // Store updated values in localStorage
    localStorage.setItem('isManager', JSON.stringify(this.isManager));
    localStorage.setItem('onlyUpdate', JSON.stringify(this.onlyUpdate));
  }
  selectContact(contactId: string) {
    // 1) store the two boolean flags
    this.updateRoleSelection();
    // 2) set and navigate
    this.contactID = contactId;
    this.router.navigate([`/${this.guid}/${this.contactID}`], {
      replaceUrl: true,
    });
    this.GetCampaignFromGuid();
    this.proceedWithNextSteps();
  }
  opencontactDataModal(): void {
    this.modalService.open(this.contactDataModal, {
      size: 'md',
      centered: true,
      backdrop: 'static', // Prevent modal from closing on backdrop click
    });
  }
  ///
  GetMatchCampaignsFromSubmission() {
    const body: any = {
      Name: 'GetMatchCampaignsFromSubmission',
      Params: {
        // UserSubmissionId: 90,
        UserSubmissionId: this.userSubmission,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res?.json?.[0]) {
          this.MatchCampaignsFromSubmission = res.json[0];
          console.log(
            'MatchCampaignsFromSubmission',
            this.MatchCampaignsFromSubmission
          );
          this.selectedPlaces = {};
          this.MatchCampaignsFromSubmission!.BB.forEach((buyBox) => {
            buyBox.C.forEach((campaign) => {
              this.selectedPlaces[campaign.CampaignId] = campaign.P.map(
                (place) => place.PlaceId
              );
            });
          });
        } else {
          this.MatchCampaignsFromSubmission = null;
        }
      },
    });
  }
  InsertIntoDestinationTable(buyBox: Bb) {
    this.spinner.show();

    // Process each campaign in the buyBox
    const approvalPromises = buyBox.C.filter(
      (campaign) => this.selectedPlaces[campaign.CampaignId]?.length > 0
    ).map((campaign) => {
      const placeIds = this.selectedPlaces[campaign.CampaignId].join(',');
      const body = {
        Name: 'InsertIntoDestinationTable',
        Params: {
          CampaignID: campaign.CampaignId,
          PlaceIDs: placeIds,
        },
      };
      return this.PlacesService.GenericAPI(body).toPromise();
    });

    Promise.all(approvalPromises)
      .then((responses) => {
        console.log('All approvals successful', responses);
        this.spinner.hide();
        this.MatchCampaignsFromSubmission = null;
        this.showToast('Campaigns and Places Approved Successfully');
      })
      .catch((error) => {
        console.error('Approval failed', error);
        this.spinner.hide();
        this.showToast('Error approving campaigns');
      });
  }

  private findCampaign(campaignId: number): C | undefined {
    if (!this.MatchCampaignsFromSubmission) return undefined;
    for (const buyBox of this.MatchCampaignsFromSubmission.BB) {
      const found = buyBox.C.find((c) => c.CampaignId === campaignId);
      if (found) return found;
    }
    return undefined;
  }

  isAllPlacesSelected(campaignId: number): boolean {
    if (!this.MatchCampaignsFromSubmission || !this.selectedPlaces[campaignId])
      return false;
    const campaign = this.findCampaign(campaignId);
    return campaign?.P.length === this.selectedPlaces[campaignId]?.length;
  }
  isPlaceSelected(campaignId: number, placeId: number): boolean {
    return this.selectedPlaces[campaignId]?.includes(placeId) ?? false;
  }
  toggleAllPlacesForCampaign(campaignId: number, places: P[], event: any) {
    if (event.target.checked) {
      // Select all places for this campaign
      this.selectedPlaces[campaignId] = places.map((p) => p.PlaceId);
    } else {
      // Deselect all places for this campaign
      this.selectedPlaces[campaignId] = [];
    }
  }
  toggleSinglePlace(campaignId: number, placeId: number) {
    if (!this.selectedPlaces[campaignId]) {
      this.selectedPlaces[campaignId] = [];
    }

    const index = this.selectedPlaces[campaignId].indexOf(placeId);
    if (index === -1) {
      this.selectedPlaces[campaignId].push(placeId);
    } else {
      this.selectedPlaces[campaignId].splice(index, 1);
    }

    // Update view manually since we're not using two-way binding
    this.cdr.detectChanges();
  }
  hasAnyPlaceSelected(campaignId: number): boolean {
    return this.selectedPlaces[campaignId]?.length > 0;
  }

  isSomePlacesSelected(campaignId: number): boolean {
    if (!this.MatchCampaignsFromSubmission || !this.selectedPlaces[campaignId])
      return false;
    const campaign = this.findCampaign(campaignId);
    return (
      this.selectedPlaces[campaignId]?.length > 0 &&
      this.selectedPlaces[campaignId]?.length < (campaign?.P?.length ?? 0)
    );
  }

  // togglePlaceSelection(campaignId: number, placeId: number) {
  //   if (!this.selectedPlaces[campaignId]) {
  //     this.selectedPlaces[campaignId] = [];
  //   }

  //   const index = this.selectedPlaces[campaignId].indexOf(placeId);
  //   if (index === -1) {
  //     this.selectedPlaces[campaignId].push(placeId);
  //   } else {
  //     this.selectedPlaces[campaignId].splice(index, 1);
  //   }
  // }
  ///
  openEmailModal(): void {
    this.modalService.open(this.emailModal, { size: 'md', centered: true });
  }
  getContactByEmail(modal: any): void {
    this.spinner.show();

    if (this.email && this.email.trim()) {
      const body = {
        Name: 'GetContactByEmail',
        Params: {
          ContactEmail: this.email,
        },
      };
      this.PlacesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.spinner.hide();

          if (res.json && res.json[0] && res.json[0].id) {
            this.contactID = res.json[0].id;
            this.router.navigate([`/${this.guid}/${this.contactID}`], {
              replaceUrl: true,
            });

            modal.close();
            this.GetCampaignFromGuid();
            this.proceedWithNextSteps();
          }
        },
      });
    }
  }
  proceedWithNextSteps(): void {
    this.GetUserSubmissionData();
    this.GetShoppingCenterManageInCampaign();
    this.GetUserSubmissionsShoppingCenters();
  }
  GetCampaignFromGuid(): void {
    const body: any = {
      Name: 'GetCampaignFromGuid',
      Params: {
        GUID: this.guid,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.selectedCampaign = res.json[0]?.id;
        this.selectedbuyBox = res.json[0]?.buyBoxId;
        this.GetBuyBoxInfo();
        this.GetGeoJsonFromBuyBox();
      },
    });
  }

  GetShoppingCenterManageInCampaign(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetShoppingCenterManageInCampaign',
      Params: {
        CampaignGUID: this.guid,
        ContactId: this.contactID,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.shoppingCenterManage = res.json;
        // console.log('ShoppingCenterManage', this.shoppingCenterManage);
      },
    });
  }
  GetUserSubmissionsShoppingCenters(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetUserSubmissionsShoppingCenters',
      Params: {
        CampaignGUID: this.guid,
        ContactId: this.contactID,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.shoppingCenterManageSubmitted = res.json;
        // console.log('shoppingCenterManageSubmitted', this.shoppingCenterManageSubmitted);
      },
    });
  }
  GetOrganizationById(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationById',
      Params: {
        organizationid: this.organizationid,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.OrganizationContacts = res.json as organizationContacts[];
      },
    });
  }
  GetUserSubmissionData(): void {
    if (this.userSubmission) {
      this.spinner.show();
      const body: any = {
        Name: 'GetUserSubmissionData',
        Params: {
          UserSubmissionId: this.userSubmission,
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          // Parse the JSON string from jsonResponse and assign it to JsonPDF
          const parsedJson = JSON.parse(res.json[0].jsonResponse);
          // Now parsedJson will be an object and can be used normally
          this.JsonPDF = parsedJson;

          if (this.JsonPDF.Availability) {
            this.JsonPDF.Availability.forEach((avail) => {
              avail.isAdded = true;
            });
          }
          if (this.JsonPDF.Tenants) {
            this.JsonPDF.Tenants.forEach((tenant) => {
              tenant.isAdded = true;
            });
          }

          this.AvailabilityAndTenants = res.json[0].AvailabilityAndTenants;
          this.isFileUploaded = true;
          this.spinner.hide();
          this.jsonGUID = this.JsonPDF.FolderGuid;
        },
      });
    }
  }
  /////////////////// card
  getBuildingSizeCount(): number {
    return this.shoppingCenterManage[0]?.O[0]?.P?.length || 0;
  }
  isAllForLeasePriceZero(): boolean {
    return this.shoppingCenterManage[0]?.O[0]?.P.every(
      (place) => place.ForLeasePrice === 0
    );
  }
  getLeasePricesCount(): number {
    return (
      this.shoppingCenterManage[0]?.O[0]?.P.filter((p) => p.ForLeasePrice !== 0)
        .length || 0
    );
  }
  getFirstThreeLeasePrices(): any[] {
    return (
      this.shoppingCenterManage[0]?.O[0]?.P.filter(
        (p) => p.ForLeasePrice !== 0
      ).slice(0, 3) || []
    );
  }
  getFirstThreeBuildingSizes(): any[] {
    return this.shoppingCenterManage[0]?.O[0]?.P.slice(0, 3) || [];
  }
  openLeasePricesModal(): void {
    this.filteredLeasePlacesManage =
      this.shoppingCenterManage[0]?.O[0]?.P.filter(
        (p) => p.ForLeasePrice !== 0
      );
    this.modalService.open(this.leasePricesModal, {
      size: 'md',
      centered: true,
    });
  }
  openBuildingSizesModal(): void {
    this.allBuildingSizes = this.shoppingCenterManage[0]?.O[0]?.P;
    this.modalService.open(this.buildingSizesModal, {
      size: 'md',
      centered: true,
    });
  }
  /////////////////// card submission
  getBuildingSizeCountSub(): number {
    return this.shoppingCenterManageSubmitted[0]?.O[0]?.P?.length || 0;
  }
  isAllForLeasePriceZeroSub(): boolean {
    return this.shoppingCenterManageSubmitted[0]?.O[0]?.P.every(
      (place) => place.ForLeasePrice === 0
    );
  }
  filteredLeasePlaces(places: any[]): any[] {
    return places.filter((p) => p.ForLeasePrice !== 0);
  }
  openLeasePricesSubmissionModal(leasePlaces: any[]) {
    this.modalLeasePlaces = leasePlaces;
    this.modalService.open(this.leasePricesSubmissionModal, {
      size: 'md',
      centered: true,
    });
  }
  openBuildingSizesSubmissionModal(places: any[]) {
    this.modalPlaces = places;
    this.modalService.open(this.buildingSizesSubmissionModal, {
      size: 'md',
      centered: true,
    });
  }
  GetBuyBoxInfo(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.TenantResult = res.json[0];
        this.organizationid = this.TenantResult.Buybox
          ? this.TenantResult.Buybox[0].BuyBoxOrganization[0]
              .BuyBoxOrganizationId
          : 0;
        this.spinner.hide();
        this.GetOrganizationById();
        this.GetOrganizationBranches();
      },
    });
  }

  // GetCampaignDetails(): void {
  //   this.spinner.show();
  //   const body: any = {
  //     Name: 'GetCampaignDetails',
  //     Params: {
  //       CampaignId: this.selectedCampaign,
  //     },
  //   };

  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (res: any) => {
  //       this.CampaignData = res.json[0];
  //       console.log('CampaignData', this.CampaignData);
  //       this.spinner.hide();
  //     },
  //   });
  // }

  GetOrganizationBranches(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationBranches',
      Params: {
        organizationid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res.json == null) {
          this.spinner.hide();
        } else {
          this.organizationBranches = res.json[0];
          this.spinner.hide();
        }
      },
    });
  }
  toggleReason() {
    this.showFullReason = !this.showFullReason;
  }
  openUploadModal(id?: number) {
    // if (id === undefined) {
    //   const guid = crypto.randomUUID();
    //   this.selectedShoppingID = guid;
    // } else {
    //   this.selectedShoppingID = id.toString();
    // }
    this.modalService.open(this.uploadPDF, { size: 'lg', centered: true });
  }

  public uploadFile(files: NgxFileDropEntry[]): void {
    this.files = files;
    if (this.isClearing) {
      this.isClearing = false;
      this.isUploading = true;
      this.uploadProgress = 0;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.fileName = file.name;
          const formData = new FormData();
          formData.append('filename', file);
          // Create a DTO object and serialize it to JSON
          const dto = {
            IsManage: this.isManager,
            IsUpdatedOnly: this.onlyUpdate,
          };
          formData.append('ConvertPdfToImagesDTO', JSON.stringify(dto));

          // const SERVER_URL = `https://api.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}/${this.selectedCampaign}`;
          const SERVER_URL = `https://apibeta.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}/${this.selectedCampaign}`;

          const req = new HttpRequest('POST', SERVER_URL, formData, {
            reportProgress: true,
            responseType: 'text', // Change responseType to 'text'
          });

          this.uploadRequest = this.httpClient.request(req).subscribe({
            next: (event: any) => {
              if (this.isClearing) {
                console.log(
                  'Modal data is being cleared, aborting image processing.'
                );
                return;
              }

              if (event.type === HttpEventType.UploadProgress) {
                this.uploadProgress = Math.round(
                  (100 * event.loaded) / event.total!
                );
                if (this.uploadProgress === 100) {
                  this.isUploading = false;
                  console.log('Upload completed successfully');
                }
              } else if (event instanceof HttpResponse) {
                // Handle the response as plain text
                if (event.status === 200) {
                  const responseText = event.body as string;
                  if (
                    responseText.includes(
                      'The pdf has been submitted successfully'
                    )
                  ) {
                    this.spinner.hide();
                    this.showToast(
                      'PDF file successfully uploaded. You will receive an email notification with the submission data'
                    );
                  } else {
                    // If the response isn't what we expect
                    this.showToast('Unexpected response from server');
                  }
                  console.log('Upload response:', event); // Log success
                }
              }
            },
            error: (error) => {
              // Only show error if it's a genuine error
              if (!this.isClearing) {
                this.isUploading = false;
                this.isConverting = false;
                this.spinner.hide();
                // Log error details
                console.log('Upload failed with error:', error); // Log error details
                // Show a failure message
                this.showToast('Failed to upload or convert PDF file!');
              }
            },
          });
        });
      }
    }
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 5000);
  }

  sendImagesArray() {
    this.isSubmitting = true;
    this.returnsubmit = true;
    this.spinner.show();
    const selectedImages = this.images.filter((image) => image.selected);
    // Extract the content of the selected images
    const array = selectedImages.map((image) => image.content);
    const shopID = this.selectedShoppingID;
    const buyboxid = this.selectedbuyBox;

    this.PlacesService.SendImagesArrayWithBuyBoxId(
      array,
      shopID,
      buyboxid
    ).subscribe({
      next: (data) => {
        this.JsonPDF = data;
        this.showToast('Images Converted successfully!');
        this.spinner.hide();
      },
    });
  }

  sendJson() {
    this.spinner.show();
    this.isSubmitting = true;
    const shopID = this.jsonGUID;
    const updatedJsonPDF = {
      ...this.JsonPDF,
      CenterNameIsAdded: this.JsonPDF.CenterNameIsAdded || false,
      CenterTypeIsAdded: this.JsonPDF.CenterTypeIsAdded || false,
      Availability: this.JsonPDF.Availability.map((avail) => ({
        ...avail,
        isAdded: avail.isAdded !== false,
      })),
      Tenants: this.JsonPDF.Tenants.map((tenant) => ({
        ...tenant,
        isAdded: tenant.isAdded !== false,
      })),
      CampaignId: this.selectedCampaign,
      userSubmissionId: this.userSubmission,
      IsSubmitted: true,
      ContactId: this.contactID,
    };

    this.PlacesService.SendJsonData(updatedJsonPDF, shopID).subscribe({
      next: (data) => {
        // Always show success message for 200 OK responses
        this.JsonPDF.IsSubmitted = true;
        this.showButtons = false;
        this.showToast('Shopping center updated successfully!');
        this.GetUserSubmissionsShoppingCenters();
        this.isSubmitting = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error occurred while updating shopping center:', error);

        // Check if it's actually a success response being misinterpreted as an error
        if (error.status === 200) {
          this.JsonPDF.IsSubmitted = true;
          // Set the new flag to hide buttons
          this.showButtons = false;
          this.showToast('Shopping center updated successfully!');
          this.GetUserSubmissionsShoppingCenters();
        } else {
          // It's a genuine error
          let errorMessage = 'Failed to update shopping center!';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.showToast(errorMessage);
        }

        this.isSubmitting = false;
        this.spinner.hide();
      },
    });
  }

  clearModalData() {
    if (this.uploadRequest) {
      this.uploadRequest.unsubscribe();
    }
    this.isClearing = true;
    this.images = [];
    this.JsonPDF = null!;
    this.AvailabilityAndTenants = {};
    this.fileName = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isConverting = false;
    this.files = [];
    this.returnsubmit = false;
    this.isFileUploaded = false;
  }

  closeModal(modal: any) {
    modal.dismiss();
    this.isClearing = false;
    this.fileName = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isConverting = false;
    this.images = [];
  }

  displayCustomImage(image: IFile): SafeUrl {
    const dataUrl = `data:${image.type};base64,${image.content}`;
    return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
  }
  // Replace the existing methods with these new ones
  toggleAddAvailability(): void {
    // this.removeavailable=true;
    this.showAddAvailabilityInput = !this.showAddAvailabilityInput;
    if (!this.showAddAvailabilityInput) {
      this.newAvailabilitySize = undefined;
    }
  }
  toggleAddTenant(): void {
    // this.removetenant=true;
    this.showAddTenantInput = !this.showAddTenantInput;
    if (!this.showAddTenantInput) {
      this.newTenantName = '';
    }
  }

  addNewAvailability(): void {
    if (this.newAvailabilitySize) {
      const newId =
        this.JsonPDF.Availability.length > 0
          ? Math.max(...this.JsonPDF.Availability.map((a) => a.id)) + 1
          : 1;

      this.JsonPDF.Availability.push({
        id: 0,
        BuildingSizeSf: this.newAvailabilitySize,
        isAdded: true,
        ForLeasePrice: 0,
        LeaseType: '',
        Suite: '',
        IsSecondGeneration: false,
        SecondaryType: '',
      });

      this.newAvailabilitySize = undefined;
      this.showAddAvailabilityInput = false;
    }
  }
  addNewTenant(): void {
    if (this.newTenantName.trim()) {
      const newId =
        this.JsonPDF.Tenants.length > 0
          ? Math.max(...this.JsonPDF.Tenants.map((t) => t.id)) + 1
          : 1;

      this.JsonPDF.Tenants.push({
        id: 0,
        Name: this.newTenantName,
        BuildingSizeSf: 0,
        SecondaryType: '',
        OrgUrl: '',
        isAdded: true,
      });

      this.newTenantName = '';
      this.showAddTenantInput = false;
    }
  }
  // Submit function to handle additional input values
  submitNewData() {
    // Handle logic for adding new data from the input fields
    this.JsonPDF.Availability.forEach((avail) => {
      if (avail.addInputVisible && avail.newBuildingSize) {
        // You can add the new availability logic here
        avail.BuildingSizeSf += avail.newBuildingSize; // Example
      }
    });
    this.JsonPDF.Tenants.forEach((tenant) => {
      if (tenant.addInputVisible && tenant.newName) {
        // You can add the new tenant logic here
        this.JsonPDF.Tenants.push({
          id: this.JsonPDF.Tenants.length + 1, // Example of generating a new ID
          Name: tenant.newName,
          BuildingSizeSf: 0, // Example default value
          SecondaryType: '',
          OrgUrl: '',
          isAdded: true,
        });
      }
    });
  }
  GetGeoJsonFromBuyBox(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetGeoJsonFromBuyBox',
      Params: {
        CampaignId: this.selectedCampaign,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res.json == null) {
          this.spinner.hide();
        } else {
          this.Polgons = res.json;
          this.spinner.hide();
        }
      },
    });
  }
  loadPolygons(): void {
    if (!this.Polgons || !Array.isArray(this.Polgons)) {
      console.error('No polygons available');
      return;
    }
    // Replace apiResponse with this.Polgons
    this.customPolygons = this.Polgons.map((item) => {
      return {
        geoJson: JSON.parse(item.json),
        visible: true,
        polygonObj: undefined,
      } as ICustomPolygon;
    });
    // Display all polygons by default using displayMyPolygons from your service.
    for (let polygon of this.customPolygons) {
      const coordinates = this.getPolygonCoordinates(polygon.geoJson);
      if (coordinates) {
        polygon.polygonObj = this.mapDrawingService.displayPolygon(
          coordinates,
          this.map
        );
      }
    }
  }
  getPolygonCoordinates(geoJson: any):
    | {
        lat: number;
        lng: number;
      }[]
    | null {
    try {
      if (!geoJson || !geoJson.geometry || !geoJson.geometry.coordinates) {
        return null;
      }

      const coordinates = geoJson.geometry.coordinates[0]?.map(
        (coord: number[]) => {
          return { lat: coord[1], lng: coord[0] };
        }
      );

      if (!coordinates) {
        return null;
      }

      return coordinates;
    } catch (error) {}
    return null;
  }

  // Toggle the visibility of a single polygon.
  togglePolygonVisibility(polygon: ICustomPolygon): void {
    polygon.visible = !polygon.visible;
    if (polygon.visible) {
      // If the polygon is not already on the map, display it.
      if (!polygon.polygonObj) {
        // polygon.polygonObj = this.mapDrawingService.displayPolygon(polygon.geoJson, this.map);
      } else {
        // Otherwise, ensure it’s set on the map.
        polygon.polygonObj.setMap(this.map);
      }
    } else {
      // Hide the polygon using hideMyPolygons from your service.
      if (polygon.polygonObj) {
        this.mapDrawingService.hidePolygon(polygon.polygonObj);
      }
    }
  }
  ngAfterViewInit(): void {
    const interval = setInterval(() => {
      if (
        this.TenantResult &&
        this.TenantResult.Buybox &&
        this.customPolygons
      ) {
        this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
        // debugger
        this.mapDrawingService.initializeDrawingManager(this.map);
        this.map.setZoom(9);
        // this.mapDrawingService.updateMapCenter(this.map, null);

        this.loadPolygons();
        clearInterval(interval);
      }
    }, 100);
  }
  /////////////////////
  openShoppingModal(id: number) {
    this.ShoppingID = id;
    console.log('this.ShoppingID', this.ShoppingID);
    this.modalService.open(this.openShopping, { size: 'lg', centered: true });
    this.GetShoppingCenterDetailsById();
  }
  GetShoppingCenterDetailsById() {
    this.spinner.show();
    const body: any = {
      Name: 'GetShoppingCenterDetailsById',
      MainEntity: null,
      Params: {
        ShoppingCenterId: this.ShoppingID,
        // ShoppingCenterId: 25990,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.CustomPlace = data.json;
        this.spinner.hide();
      },
    });
  }
  /////////////////////////
  getImagesArray(): string[] {
    if (!this.CustomPlace?.Images) return [];
    return this.CustomPlace.Images.split(',').map((url) => url.trim());
  }
  toggleAddTenantInput() {
    // Initialize CustomPlace.Tenants if it’s null or undefined
    if (!this.CustomPlace?.Tenants) {
      this.CustomPlace = {
        ...this.CustomPlace,
        Tenants: [], // Initialize an empty array for tenants
      } as PropertiesDetails;
    }
    this.showAddTenantInput = !this.showAddTenantInput;
    if (this.showAddTenantInput) {
      this.newNameTenant = '';
      this.newUrlTenant = '';
    }
  }
  cancelAddTenant() {
    this.showAddTenantInput = false;
    this.newNameTenant = '';
    this.newUrlTenant = '';
  }
  // Add a new tenant (send to API and update locally)
  addTenantNew() {
    if (
      !this.newNameTenant ||
      this.newNameTenant.trim() === '' ||
      !this.newUrlTenant ||
      this.newUrlTenant.trim() === ''
    ) {
      this.showToast('Please enter a valid tenant name.');
      return;
    }
    // Basic validation for domain format (optional, since HTML pattern handles it)
    const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!domainPattern.test(this.newUrlTenant.trim())) {
      alert('Please enter a valid domain (e.g., example.com).');
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'ModifyTenantsWithBranch',
      Params: {
        ShoppingCenterId: this.ShoppingID,
        Name: this.newNameTenant,
        Url: this.newUrlTenant,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        // Assuming the API returns the new tenant or an updated list
        const newTenant: Tenant = {
          Id: data.json?.Id || this.CustomPlace?.Tenants.length! + 1, // Generate a temporary ID or use API response
          Name: this.newNameTenant,
          URL: this.newUrlTenant,
        };
        // Add the new tenant to CustomPlace.Tenants
        if (this.CustomPlace && this.CustomPlace.Tenants) {
          this.CustomPlace.Tenants.push(newTenant);
        } else {
          // Initialize Tenants if it doesn't exist
          this.CustomPlace = {
            ...this.CustomPlace,
            Tenants: [newTenant],
          } as PropertiesDetails;
        }
        this.spinner.hide();
        this.showToast('New tenant added successfully!');
        this.showAddTenantInput = false;
        this.newNameTenant = '';
      },
    });
  }
  toggleAddPlaceInput() {
    if (!this.CustomPlace?.Availability) {
      this.CustomPlace = {
        ...this.CustomPlace,
        Availability: [], // Initialize Availability if null
      } as PropertiesDetails;
    }
    this.showAddPlaceInput = !this.showAddPlaceInput;
    if (this.showAddPlaceInput) {
      this.newPlaceSqFT = 0; // Reset the input value
    }
  }
  cancelAddPlace() {
    this.showAddPlaceInput = false;
    this.newPlaceSqFT = 0;
  }
  // Add a new place (send to API and update locally)
  addNewPlace() {
    if (!this.newPlaceSqFT || this.newPlaceSqFT <= 0) {
      this.showToast('Please enter a valid SQFT');
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'AddAvailability',
      Params: {
        ShoppingCenterId: this.ShoppingID,
        BuildingSizeSf: this.newPlaceSqFT,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        // Assuming the API returns the new space or an updated list
        const newSpace: Availability = {
          Id: data.json?.Id || this.CustomPlace?.Availability.length! + 1, // Generate a temporary ID or use API response
          BuildingSizeSf: this.newPlaceSqFT,
        };
        // Add the new space to CustomPlace.Availability
        if (this.CustomPlace && this.CustomPlace.Availability) {
          this.CustomPlace.Availability.push(newSpace);
        } else {
          // Initialize Availability if it doesn't exist
          this.CustomPlace = {
            ...this.CustomPlace,
            Availability: [newSpace],
          } as PropertiesDetails;
        }
        this.showAddPlaceInput = false;
        this.spinner.hide();
      },
    });
  }
  // Start editing a place
  startEditPlace(placeId: number, currentSqFt: number, index: number) {
    this.editingPlaceId = placeId;
    this.showEditInput = true;
    this.editedPlaceSqFT = currentSqFt;
  }
  cancelEditPlace() {
    this.editingPlaceId = null;
    this.showEditInput = false;
    this.editedPlaceSqFT = 0;
  }
  saveEditedPlace(placeId: number) {
    if (!this.editedPlaceSqFT || this.editedPlaceSqFT <= 0) {
      this.showToast('Please enter a valid SQFT');
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'UpdateBuildingSizeSfForAvailability',
      Params: {
        PlaceId: placeId,
        ShoppingCenterId: this.selectedShoppingID,
        NewBuildingSizeSf: this.editedPlaceSqFT,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        const spaceIndex = this.CustomPlace?.Availability.findIndex(
          (space) => space.Id === placeId
        );
        if (spaceIndex !== -1 && this.CustomPlace?.Availability) {
          this.CustomPlace.Availability[spaceIndex!].BuildingSizeSf =
            this.editedPlaceSqFT;
        }
        this.spinner.hide();
        this.showToast('Place updated successfully!');
        this.editingPlaceId = null;
        this.showEditInput = false;
        this.editedPlaceSqFT = 0;
      },
    });
  }
  openDeletePlaceModal(placeId: number) {
    this.deleteId = placeId;
    this.deleteType = 'Place';
    this.modalService.open(this.deletePlaceModal, { size: 'md' });
  }
  openDeleteTenantModal(tenantId: number) {
    this.deleteId = tenantId;
    this.deleteType = 'Tenant';
    this.modalService.open(this.deletePlaceModal, { size: 'md' });
  }
  // Confirm and perform the delete (for both places and tenants)
  confirmDelete(modal: any) {
    if (this.deleteType === 'Place' && this.deleteId !== null) {
      this.deletePlace(this.deleteId);
    } else if (this.deleteType === 'Tenant' && this.deleteId !== null) {
      this.deleteTenant(this.deleteId);
    }
    modal.close('Delete confirmed');
  }
  deletePlace(placeId: number) {
    this.spinner.show();
    const body: any = {
      Name: 'DeleteAvailabilityByPlaceId',
      Params: {
        placeId: placeId,
        ShoppingCenterId: this.ShoppingID,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const index = this.CustomPlace?.Availability.findIndex(
          (space) => space.Id === placeId
        );
        if (index !== -1 && this.CustomPlace?.Availability) {
          this.CustomPlace.Availability.splice(index!, 1);
        }
        this.showToast('Place deleted successfully!');
        this.spinner.hide();
      },
    });
  }
  deleteTenant(tenantId: number) {
    this.spinner.show();
    const body: any = {
      Name: 'DeleteBranchByOrganizationId',
      Params: {
        organizationID: tenantId,
        shoppingCenterId: this.ShoppingID,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const index = this.CustomPlace?.Tenants.findIndex(
          (tenant) => tenant.Id === tenantId
        );
        if (index !== -1 && this.CustomPlace?.Tenants) {
          this.CustomPlace.Tenants.splice(index!, 1);
        }
        this.spinner.hide();
        this.showToast('Tenant deleted successfully!');
      },
    });
  }
  isLast(currentItem: any, array: any[]): boolean {
    return this.shoppingCenterService.isLast(currentItem, array);
  }
  /////////////
}
