import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import {
  Availability,
  AvailabilityTenant,
  IFile,
  jsonGPT,
  Tenant,
} from 'src/app/shared/models/manage-prop';
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
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { ShoppingCenter } from 'src/app/shared/models/landingPlace';
import { TenantShoppingCenter } from 'src/app/shared/models/tenantShoppingCenter';
@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    RouterModule,
    FormsModule,
    NgxFileDropModule,
  ],
  providers: [],
  templateUrl: './tenant.component.html',
  styleUrl: './tenant.component.css',
})
export class TenantComponent implements OnInit, AfterViewInit {
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
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
  removeavailable:boolean=false;
  removetenant:boolean=false;  
  userSubmission: any;
  jsonGUID!: string;
  showAddAvailabilityInput = false;
  newAvailabilitySize: number | undefined;
  showAddTenantInput = false;
  newTenantName = '';
  shoppingCenterManage:TenantShoppingCenter[]=[];
  Polgons!: any[];
  customPolygons: ICustomPolygon[] = [];
  map!: google.maps.Map;
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    private mapDrawingService: CampaignDrawingService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.userSubmission = params.get('userSubmission');
    });
    this.contactID = localStorage.getItem('contactId');

    this.activatedRoute.params.subscribe((params) => {
      this.guid = params['guid'];
      this.GetCampaignFromGuid();
      // this.GetCampaignDetails();
    });

    const guid = crypto.randomUUID();
    this.selectedShoppingID = guid;
    this.GetUserSubmissionData();
    this.GetShoppingCenterManageInCampaign();
  }

  GetCampaignFromGuid(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetCampaignFromGuid',
      Params: {
        GUID: this.guid,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.selectedCampaign = res.json[0].id;
        this.selectedbuyBox = res.json[0].buyBoxId;
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
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.shoppingCenterManage = res.json;
        console.log('ShoppingCenterManage', this.shoppingCenterManage);
        
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

          const SERVER_URL = `https://api.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}/${this.selectedCampaign}`;

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
    };
  
    this.PlacesService.SendJsonData(updatedJsonPDF, shopID).subscribe({
      next: (data) => {
        let successMessage = '';
        
        // Handle both string and object responses
        if (typeof data === 'string') {
          // If the response is a string, check for success message
          if (data.includes('Shopping center updated successfully')) {
            successMessage = 'Shopping center updated successfully!';
          }
        } else if (typeof data === 'object') {
          // If the response is JSON, check for success status/message
          // Adjust this based on your actual API response structure
          if (data.success || data.message?.includes('success')) {
            successMessage = data.message || 'Shopping center updated successfully!';
          }
        }
        if (successMessage) {
          this.showToast(successMessage);
          this.clearModalData();
          this.modalService.dismissAll();
        } else {
          this.showToast('Received unexpected response from server');
        }
        this.isSubmitting = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error occurred while updating shopping center:', error);
        // Handle different error cases
        let errorMessage = 'Failed to update shopping center!';
        if (error.status === 200) {
          // Sometimes errors come with 200 status but error message in response
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        this.showToast(errorMessage);
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
    this.removeavailable=true;
    this.showAddAvailabilityInput = !this.showAddAvailabilityInput;
    if (!this.showAddAvailabilityInput) {
      this.newAvailabilitySize = undefined;
    }
  }
  toggleAddTenant(): void {
    this.removetenant=true;
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
      if (this.TenantResult && this.TenantResult.Buybox&&this.customPolygons) {
        this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
        // debugger
        this.mapDrawingService.initializeDrawingManager(this.map);
        this.map.setZoom(9)
        // this.mapDrawingService.updateMapCenter(this.map, null);
        
        this.loadPolygons();
        clearInterval(interval);
      }
    }, 100);
  }
}
