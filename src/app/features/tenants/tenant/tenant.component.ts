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
  buyboxcolor!: string;
  isSubmitting: boolean = false;
  returnsubmit: boolean = false;
  organizationid!: number;
  isFileUploaded: boolean = false;
  isClearing: boolean = false;
  uploadRequest: any;
  selectedCampaign!: number;
  CampaignData!: any;

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
    this.buyboxcolor = '#FF5733';

    this.contactID = localStorage.getItem('contactId');
    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
      this.selectedCampaign = params['campaignId'];
      // this.GetCampaignDetails();
    });
    this.GetBuyBoxInfo();
    const guid = crypto.randomUUID();
    this.selectedShoppingID = guid;
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
      this.isConverting = false;
      this.isFileUploaded = false;
      this.images = [];
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Set the file name immediately when the file is dropped
          this.fileName = file.name;

          // Create FormData and append the file
          const formData = new FormData();
          formData.append('filename', file);

          const SERVER_URL = `https://api.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;

          // Create the HTTP request with progress tracking
          const req = new HttpRequest('POST', SERVER_URL, formData, {
            reportProgress: true,
            responseType: 'json',
          });

          // Store the HTTP request to be able to cancel if needed
          this.uploadRequest = this.httpClient.request(req).subscribe(
            (event: any) => {
              // If modal data is cleared, abort processing images
              if (this.isClearing) {
                console.log(
                  'Modal data is being cleared, aborting image processing.'
                );
                return; // Abort if modal data is cleared
              }

              if (event.type === HttpEventType.UploadProgress) {
                // Update progress bar based on the current upload progress
                this.uploadProgress = Math.round(
                  (100 * event.loaded) / event.total!
                );
                if (this.uploadProgress === 100) {
                  this.isUploading = false; // Stop showing the progress bar once the upload is complete
                  this.isConverting = true; // Start converting the images
                }
              } else if (event instanceof HttpResponse) {
                const response = event.body;
                if (response && response.images && !this.isClearing) {
                  this.images = response.images.map(
                    (img: string, index: number) => ({
                      name: `Image ${index + 1}`,
                      type: 'image/png',
                      content: img,
                      selected: false,
                    })
                  );
                  this.pdfFileName = response.pdfFileName;
                  this.isConverting = false;
                  this.spinner.hide();
                  this.showToast(
                    'PDF File uploaded and converted successfully!'
                  );
                  this.isFileUploaded = true; // Enable submit button

                  // Open the modal after images are returned and the upload completes
                  this.openUploadModal(0);
                }
              }
            },
            (error) => {
              this.isUploading = false;
              this.isConverting = false;
              this.spinner.hide();
              this.showToast('Failed to upload or convert PDF file!');
              this.fileName = '';
            }
          );
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
    }, 3000);
  }

  sendImagesArray() {
    this.isSubmitting = true;
    this.returnsubmit = true;
    this.spinner.show();
    const selectedImages = this.images.filter((image) => image.selected);
    // Extract the content of the selected images
    const array = selectedImages.map((image) => image.content);
    const shopID = this.selectedShoppingID;
    const buyboxid=this.selectedbuyBox


    this.PlacesService.SendImagesArrayWithBuyBoxId(array, shopID, buyboxid).subscribe({
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

    this.JsonPDF = {
      ...this.JsonPDF,
      CenterNameIsAdded: this.JsonPDF.CenterNameIsAdded || false,
      CenterTypeIsAdded: this.JsonPDF.CenterTypeIsAdded || false,
    };

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
      CampaignId: this.selectedCampaign,
    };

    // Send the updated JsonPDF data
    this.PlacesService.SendJsonData(updatedJsonPDF, shopID).subscribe({
      next: (data) => {
        this.showToast('Shopping center updated successfully!');
        this.clearModalData();
        this.modalService.dismissAll();
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error occurred while updating shopping center:', error);
        this.spinner.hide();
        this.showToast('Failed to update shopping center!');
      },
    });
    this.isSubmitting = false;
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
}
