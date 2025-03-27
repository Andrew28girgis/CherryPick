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
  organizationid!:string
  isFileUploaded: boolean = false; // To track whether a file has been uploaded

  

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
      console.log(this.selectedbuyBox); 
      this.GetBuyBoxInfo();
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
        this.organizationid = this.TenantResult?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.BuyBoxOrganizationId?.toString() ?? '';
        console.log('tenant', this.TenantResult);
        
        this.spinner.hide();

        this.GetOrganizationBranches();
      },
    });
  }

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
        this.organizationBranches = res.json[0];
        console.log('asas',this.organizationBranches);
        this.spinner.hide();
      },
    });
  }
  openUploadModal(id: number) {
    if (id === undefined) {
      const guid = crypto.randomUUID();

      this.selectedShoppingID = guid;
    } else {
      this.selectedShoppingID = id.toString();
    }
    this.modalService.open(this.uploadPDF, { size: 'lg', centered: true });
  }
  public uploadFile(files: NgxFileDropEntry[]): void {
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Set the file name immediately
          this.fileName = file.name;
  
          const formData = new FormData();
          formData.append('filename', file);
          this.isUploading = true;
          this.uploadProgress = 0;
  
          const SERVER_URL = `https://api.cherrypick.com/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;
  
          const req = new HttpRequest('POST', SERVER_URL, formData, {
            reportProgress: true,
            responseType: 'json',
          });
  
          this.httpClient.request(req).subscribe(
            (event: any) => {
              if (event.type === HttpEventType.UploadProgress) {
                this.uploadProgress = Math.round((100 * event.loaded) / event.total!);
                if (this.uploadProgress === 100) {
                  this.isUploading = false;
                  this.isConverting = true;
                }
              } else if (event instanceof HttpResponse) {
                const response = event.body;
                if (response && response.images) {
                  this.images = response.images.map((img: string, index: number) => ({
                    name: `Image ${index + 1}`,
                    type: 'image/png',
                    content: img,
                    selected: false,
                  }));
                  this.pdfFileName = response.pdfFileName;
                  this.isConverting = false;
                  this.spinner.hide();
                  this.showToast('PDF File uploaded and converted successfully!');
  
                  // Automatically send the images if there are 3 or fewer images
                  if (this.images.length <= 3) {
                    this.sendJson(); // Automatically submit the images
                  }
  
                  // Enable submit button after file is uploaded
                  this.isFileUploaded = true;  // Set flag to true
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
    this.isSubmitting = false;

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
    this.returnsubmit = false;
    
  }
  closeModal(modal: any) {
    modal.dismiss();
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
