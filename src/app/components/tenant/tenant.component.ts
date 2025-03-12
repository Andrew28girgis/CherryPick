import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import {
  AvailabilityTenant,
  IFile,
  jsonGPT,
} from 'src/app/shared/models/manage-prop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { PlacesService } from '../../shared/services/places.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  HttpClient,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {
  Availability,
  PropertiesDetails,
  Tenant,
} from 'src/app/shared/models/manage-prop-shoppingCenter';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgxFileDropModule } from 'ngx-file-drop';
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
export class TenantComponent implements OnInit {
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
  newTenantName: string = '';
  CustomPlace!: PropertiesDetails | undefined;
  newTenantUrl: string = '';
  public files: NgxFileDropEntry[] = [];
  selectedShoppingID!: string | undefined;
  showAddTenantInput: boolean = false;
  JsonPDF!: jsonGPT;
  AvailabilityAndTenants: AvailabilityTenant = {};
  fileName!: string;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isConverting: boolean = false;
  images: IFile[] = [];
  pdfFileName: string = '';
  contactID!: any;
  test!: number;
  TenantResult: any = [];
  organizationBranches: any = [];
  selectedbuyBox!: string;
  buyboxid!: number;
  managementorganizationId!: number;
  buyboxDescription!: string;
  brokerlinkedin!: string;
  brokerphoto!: string;
  brokersignature!: any;
  MinBuildingSize!: number;
  MaxBuildingSize!: number;
  address!: string;
  states!: string;
  buyboxcolor!: string;
  ManagementOrganizationDesc!: string;
  buyboxname!: string;
  smalldescription: string[] = [];
  firstnamemanagerorganization!: string;
  lastnamemanagerorganization!: string;
  managementorganizationname!: string;
  ManagerOrganizationDescription!: any;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}
  ngOnInit(): void {
    this.contactID = localStorage.getItem('contactId');
    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
      this.GetBuyBoxInfo();
    });
  }

  GetBuyBoxInfo(): void {
    this.spinner.show(); // Show the spinner before the API request

    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.TenantResult = res.json[0];

        // Use destructuring to extract values from the API response
        const buyboxData = this.TenantResult.Buybox[0].BuyBoxOrganization[0];
        const managerOrganizationData =
          buyboxData.ManagerOrganization[0].ManagerOrganizationContacts[0];

        // Assign the properties directly
        this.buyboxid = buyboxData.BuyBoxOrganizationId;
        this.buyboxDescription = buyboxData.BuyBoxOrganizationDescription;
        this.buyboxname = buyboxData.Name;
        this.firstnamemanagerorganization = managerOrganizationData.Firstname;
        this.lastnamemanagerorganization = managerOrganizationData.LastName;
        this.managementorganizationname =
          buyboxData.ManagerOrganization[0].ManagerOrganizationName;
        this.ManagerOrganizationDescription =
          buyboxData.ManagerOrganization[0].ManagerOrganizationDescription;
        this.managementorganizationId =
          buyboxData.ManagerOrganization[0].ManagerOrganizationId;
        this.brokerlinkedin = managerOrganizationData.LinkedIn;
        this.MinBuildingSize = this.TenantResult.Buybox[0].MinBuildingSize;
        this.MaxBuildingSize = this.TenantResult.Buybox[0].MaxBuildingSize;
        this.ManagementOrganizationDesc =
          buyboxData.ManagerOrganization[0].ManagerOrganizationDescription;
        this.brokerphoto = managerOrganizationData.Photo;
        this.brokersignature = managerOrganizationData.Profile;
        this.buyboxcolor = '#bd3e3e';

        this.smalldescription = Array.isArray(
          this.TenantResult.Buybox[0].Description
        )
          ? this.TenantResult.Buybox[0].Description
          : [this.TenantResult.Buybox[0].Description];

        this.spinner.hide();

        this.GetOrganizationBranches();
      }
    });
  }

  GetOrganizationBranches(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetOrganizationBranches',
      Params: {
        organizationid: this.buyboxid,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.organizationBranches = res.json[0];
        this.address = this.organizationBranches.Address;
        this.states = this.organizationBranches.States;
        this.spinner.hide();
      }
    });
  }
  // manual display and edit shopping center
  openUploadModal(id: number) {
    if (id === undefined) {
      const guid = crypto.randomUUID();

      this.selectedShoppingID = guid;
    } else {
      this.selectedShoppingID = id.toString();
    }
    this.modalService.open(this.uploadPDF, { size: 'xl', centered: true });
  }
  public uploadFile(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          const formData = new FormData();
          formData.append('file', file, file.name);
          this.fileName = file.name;
          this.isUploading = true;
          this.uploadProgress = 0;

          const SERVER_URL = `https://api.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;
          // const SERVER_URL = `http://10.0.0.15:8082/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;

          // Create a request with progress reporting enabled
          const req = new HttpRequest('POST', SERVER_URL, formData, {
            reportProgress: true, // Enable progress tracking
            responseType: 'json',
          });

          this.httpClient.request(req).subscribe(
            (event: any) => {
              if (event.type === HttpEventType.UploadProgress) {
                // Calculate upload progress percentage
                this.uploadProgress = Math.round(
                  (100 * event.loaded) / event.total!
                );
                if (this.uploadProgress === 100) {
                  // Upload complete, switch to converting state
                  this.isUploading = false;
                  this.isConverting = true;
                }
              } else if (event instanceof HttpResponse) {
                // Conversion complete; extract images from the new API response structure

                const response = event.body;
                if (response && response.images) {
                  this.images = response.images.map(
                    (img: string, index: number) => ({
                      name: `Image ${index + 1}`,
                      type: 'image/png', // Adjust this if your images are of a different type
                      content: img,
                      selected: false,
                    })
                  );
                  this.pdfFileName = response.pdfFileName;
                }
                this.isConverting = false;
                this.spinner.hide();
                this.showToast('PDF File uploaded and converted successfully!');
              }
            },
            (error) => {
              this.isUploading = false;
              this.isConverting = false;
              this.spinner.hide();
              this.showToast('Failed to upload or convert PDF file!');
            }
          );
        });
      } else {
        // Handle directory entry if needed
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
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
    }, 3000);
  }
  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
  // Add a new tenant (send to API and update locally)
  addNewTenant() {
    if (
      !this.newTenantName ||
      this.newTenantName.trim() === '' ||
      !this.newTenantUrl ||
      this.newTenantUrl.trim() === ''
    ) {
      this.showToast('Please enter a valid tenant name.');
      return;
    }
    const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!domainPattern.test(this.newTenantUrl.trim())) {
      alert('Please enter a valid domain (e.g., example.com).');
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'ModifyTenantsWithBranch',
      Params: {
        ShoppingCenterId: this.selectedShoppingID,
        Name: this.newTenantName,
        Url: this.newTenantUrl,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        // Assuming the API returns the new tenant or an updated list
        const newTenant: Tenant = {
          Id: data.json?.Id || this.CustomPlace?.Tenants.length! + 1, // Generate a temporary ID or use API response
          Name: this.newTenantName,
          URL: this.newTenantUrl,
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
        this.newTenantName = '';
      }
    });
  }
  sendImagesArray() {
    this.spinner.show();
    const selectedImages = this.images.filter((image) => image.selected);
    // Extract the content of the selected images
    const array = selectedImages.map((image) => image.content);
    const shopID = this.selectedShoppingID;
    this.PlacesService.SendImagesArray(array, shopID).subscribe({
      next: (data) => {
        this.JsonPDF = data;
        this.showToast('Images Converted successfully!');
        this.spinner.hide();
      }
    });
  }
  sendJson() {
    this.spinner.show();
    const shopID = this.selectedShoppingID;

    // Add dynamic properties for CenterName and CenterType
    this.JsonPDF = {
      ...this.JsonPDF,
      CenterNameIsAdded: this.JsonPDF.CenterNameIsAdded || false,
      CenterTypeIsAdded: this.JsonPDF.CenterTypeIsAdded || false,
    };

    // Do not filter Availability and Tenants; send all items with their updated isAdded states
    const updatedJsonPDF = {
      ...this.JsonPDF,
      Availability: this.JsonPDF.Availability.map((avail) => ({
        ...avail,
        isAdded: avail.isAdded || false, // Ensure isAdded is always defined
      })),
      Tenants: this.JsonPDF.Tenants.map((tenant) => ({
        ...tenant,
        isAdded: tenant.isAdded || false, // Ensure isAdded is always defined
      })),
    };

    // Send the updated JsonPDF data
    this.PlacesService.SendJsonData(updatedJsonPDF, shopID).subscribe({
      next: (data) => {
        this.showToast('shopping center updated successfully!');
        this.clearModalData();
        this.modalService.dismissAll();
        this.spinner.hide();
      }
    });
  }
  // Method to clear all modal data
  clearModalData() {
    this.images = []; // Clear images array
    this.JsonPDF = null!; // Clear PDF data
    this.AvailabilityAndTenants = {}; // Clear "Our Data"
    this.fileName = ''; // Clear file name
    this.uploadProgress = 0; // Reset upload progress
    this.isUploading = false; // Reset upload state
    this.isConverting = false; // Reset conversion state
    this.files = []; // Clear dropped files
  }
  closeModal(modal: any) {
    modal.dismiss();
    this.fileName = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isConverting = false;
    this.images = [];
  }
  // Method to convert base64 to a SafeUrl for image display
  displayCustomImage(image: IFile): SafeUrl {
    const dataUrl = `data:${image.type};base64,${image.content}`;
    return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
  }
}
