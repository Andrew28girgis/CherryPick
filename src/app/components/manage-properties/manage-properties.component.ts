import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/services/places.service';
import { AvailabilityTenant, IFile, jsonGPT, Properties } from 'src/models/manage-prop';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-manage-properties',
  templateUrl: './manage-properties.component.html',
  styleUrl: './manage-properties.component.css',
})
export class ManagePropertiesComponent implements OnInit {
  properties: Properties[] = [];
  contactID!: any;
  selectedShoppingID!:string | undefined;
  public files: NgxFileDropEntry[] = [];
  fileName!: string;
  images: IFile[] = [];
  uploadProgress: number = 0;
  isUploading: boolean = false;
  isConverting: boolean = false;
  pdfFileName:string='';
  test!:number;
  JsonPDF!: jsonGPT;
  AvailabilityAndTenants: AvailabilityTenant = {};
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}
  ngOnInit() {
    this.GetContactShoppingCenters();
    this.contactID =  localStorage.getItem('contactId')  ;
    console.log('Contact ID:', this.contactID);
  }

  GetContactShoppingCenters() {
    this.spinner.show();
    const body: any = {
      Name: 'GetContactShoppingCenters',
      MainEntity: null,
      Params: {
        // ContactId: this.contactID,
        ContactId: 15549,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.properties = data.json;
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching Shopping center Data:', err);
        this.spinner.hide();
      },
    });
  }
  openUploadModal(id: number) {
    if (id === undefined) {
      const guid = crypto.randomUUID();
        // console.log(guid);
        this.selectedShoppingID = guid;
    } else {
        this.selectedShoppingID = id.toString();
    }
    console.log('Selected Shopping ID:', this.selectedShoppingID);
    this.getAvailabilityTenants();
    this.modalService.open(this.uploadPDF, { size: 'xl', centered: true });
  }
  getAvailabilityTenants() {
    this.spinner.show();
    const body: any = {
      Name: 'GetShoppingCenterAvailabilityAndTenants',
      MainEntity: null,
      Params: {
        // ContactId: this.contactID,
        shoppingcenterId: this.selectedShoppingID,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data.json) {
          this.AvailabilityAndTenants = {
            availability: data.json.Availability || [],
            tenants: data.json.Tenants || [],
          };
        } else {
          this.AvailabilityAndTenants = { availability: [], tenants: [] };
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching Availability Tenants:', err);
        this.spinner.hide();
      },
    });
  }
  closeModal(modal: any) {
    modal.dismiss();
    this.fileName = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isConverting = false;
    this.images=[];
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

          // const SERVER_URL = `https://api.capsnap.ai/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;
          const SERVER_URL = `http://10.0.0.15:8082/api/BrokerWithChatGPT/ConvertPdfToImages/${this.selectedShoppingID}/${this.contactID}`;

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
                console.log('API Response:', event.body);
                const response = event.body;
                if (response && response.images) {
                  this.images = response.images.map((img: string, index: number) => ({
                    name: `Image ${index + 1}`,
                    type: 'image/png', // Adjust this if your images are of a different type
                    content: img,
                    selected: false,
                  }));
                  this.pdfFileName=response.pdfFileName;
                  console.log('pdfFileName:', this.pdfFileName);
                }
                this.isConverting = false;
                this.spinner.hide();
                this.showToast('PDF File uploaded and converted successfully!');
              }
            },
            (error) => {
              console.error('Error during upload/conversion:', error);
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
  // Method to convert base64 to a SafeUrl for image display
  displayCustomImage(image: IFile): SafeUrl {
    const dataUrl = `data:${image.type};base64,${image.content}`;
    return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
  }
  sendImagesArray() {
    this.spinner.show();
    const selectedImages = this.images.filter(image => image.selected);
    // Extract the content of the selected images
    const array = selectedImages.map(image => image.content);
    this.PlacesService.SendImagesArray(array).subscribe({
      next: (data) => {
        this.JsonPDF = data;
        this.showToast('Images Converted successfully!');
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching APIs:', error);
        this.spinner.hide();
      },
    });
  }
  sendJson() {
    this.spinner.show();
    const shopID = this.selectedShoppingID;
    this.PlacesService.SendJsonData(this.JsonPDF, shopID).subscribe({
      next: (data) => {
        console.log('Data:', data);
        this.showToast('shopping center updated successfully!');
        this.spinner.hide();
        this.closeModal(this.modalService);
        // this.modalService.dismissAll();
      },
      error: (error) => {
        console.error('Error:', error);
        this.showToast('Failed to update shopping center!');
        this.spinner.hide();
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
}
