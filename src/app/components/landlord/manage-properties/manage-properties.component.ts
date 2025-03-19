import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/shared/services/places.service';
import {
  AvailabilityTenant,
  IFile,
  jsonGPT,
  Properties,
} from 'src/app/shared/models/manage-prop';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import {
  HttpClient,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  Availability,
  PropertiesDetails,
  Tenant,
} from 'src/app/shared/models/manage-prop-shoppingCenter';

@Component({
  selector: 'app-manage-properties',
  templateUrl: './manage-properties.component.html',
  styleUrl: './manage-properties.component.css',
})
export class ManagePropertiesComponent implements OnInit {
  properties: Properties[] = [];
  contactID!: any;
  selectedShoppingID!: string | undefined;
  public files: NgxFileDropEntry[] = [];
  fileName!: string;
  images: IFile[] = [];
  uploadProgress: number = 0;
  isUploading: boolean = false;
  isConverting: boolean = false;
  pdfFileName: string = '';
  test!: number;
  JsonPDF!: jsonGPT;
  AvailabilityAndTenants: AvailabilityTenant = {};
  CustomPlace!: PropertiesDetails | undefined;
  showInputField: string | null = null;
  newPlaceSqFT!: number;
  showAddPlaceInput: boolean = false;
  editingPlaceId: number | null = null;
  showEditInput: boolean = false;
  editedPlaceSqFT!: number;
  deleteType: string = '';
  deleteId: number | null = null;
  showAddTenantInput: boolean = false;
  newTenantName: string = '';
  newTenantUrl: string = '';
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
  @ViewChild('openShopping', { static: true }) openShopping!: TemplateRef<any>;
  @ViewChild('deletePlaceModal', { static: true })
  deletePlaceModal!: TemplateRef<any>;
  constructor(
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}
  ngOnInit() {
    this.contactID = localStorage.getItem('contactId');
    this.GetContactShoppingCenters();
  }

  GetContactShoppingCenters() {
    this.spinner.show();
    const body: any = {
      Name: 'GetContactShoppingCenters',
      MainEntity: null,
      Params: {
        ContactId: this.contactID,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.properties = data.json;
        this.spinner.hide();
      },
    });
  }

  openShoppingModal(id: number) {
    this.selectedShoppingID = id.toString();
    this.modalService.open(this.openShopping, { size: 'xl', centered: true });
    this.GetShoppingCenterDetailsById();
  }

  GetShoppingCenterDetailsById() {
    this.spinner.show();
    const body: any = {
      Name: 'GetShoppingCenterDetailsById',
      MainEntity: null,
      Params: {
        ShoppingCenterId: this.selectedShoppingID,
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
      this.newTenantName = '';
      this.newTenantUrl = '';
    }
  }

  cancelAddTenant() {
    this.showAddTenantInput = false;
    this.newTenantName = '';
    this.newTenantUrl = '';
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
    // Basic validation for domain format (optional, since HTML pattern handles it)
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
        ShoppingCenterId: this.selectedShoppingID,
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
        ShoppingCenterId: this.selectedShoppingID,
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
        shoppingCenterId: this.selectedShoppingID,
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
  closeModal(modal: any) {
    modal.dismiss();
    this.fileName = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isConverting = false;
    this.images = [];
  }
  // Method to UploadPDF file
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
                this.saveFileInfoInDatabase();
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
  saveFileInfoInDatabase() {
    this.spinner.show();
    const body: any = {
      Name: 'LogSubmission',
      MainEntity: null,
      Params: {
        ContactId: this.contactID,
        ShoppingCenterId: this.selectedShoppingID,
        FileName: this.pdfFileName,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide();
      },
    });
  }
  // Method to convert base64 to a SafeUrl for image display
  displayCustomImage(image: IFile): SafeUrl {
    const dataUrl = `data:${image.type};base64,${image.content}`;
    return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
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
      },
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
      },
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
