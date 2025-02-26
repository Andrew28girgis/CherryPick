import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/services/places.service';
import { IFile, Properties } from 'src/models/manage-prop';
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
  contactID!: number;
  public files: NgxFileDropEntry[] = [];
  fileName!: string;
  images: IFile[] = []; // Array to store images from the API response
  uploadProgress: number = 0; // Track upload progress
  isUploading: boolean = false; // Track upload state
  isConverting: boolean = false; // Track conversion state
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
  }

  GetContactShoppingCenters() {
    this.spinner.show();
    const body: any = {
      Name: 'GetContactShoppingCenters',
      MainEntity: null,
      Params: {
        ContactId: 15549,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.properties = data.json;
        console.log('Properties:', this.properties);
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching buybox info:', err);
        this.spinner.hide();
      },
    });
  }
  openUploadModal() {
    this.modalService.open(this.uploadPDF, { size: 'lg', centered: true });
  }
  closeModal(modal: any) {
    modal.dismiss();
  }
  // Method to UploadPDF file
  public uploadFile(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          const formData = new FormData();
          formData.append('pdf', file, file.name);
          this.fileName = file.name;
          this.isUploading = true; // Start uploading
          this.uploadProgress = 0; // Reset progress

          const SERVER_URL = `https://api.cherrypick.com/api/RealEstate/ConvertPdfToPng`;

          // Create a request with progress reporting enabled
          const req = new HttpRequest('POST', SERVER_URL, formData, {
            reportProgress: true, // Enable progress tracking
            responseType: 'json',
          });

          // Send the request
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
                // Conversion complete
                console.log('API Response:', event.body);
                this.images = event.body as IFile[]; // Store the images
                this.isConverting = false; // Conversion complete
                this.spinner.hide();
                this.showToast('PDF File uploaded and converted successfully!');
                this.modalService.dismissAll();
              }
            },
            (error) => {
              console.log(error);
              this.isUploading = false; // Upload failed
              this.isConverting = false; // Conversion failed
              this.spinner.hide();
              this.showToast('Failed to upload or convert PDF file!');
            }
          );
        });
      } else {
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        // Handle directory entry if needed
      }
    }
  }
  // Method to convert base64 to a SafeUrl for image display
  displayCustomImage(image: IFile): SafeUrl {
    const dataUrl = `data:${image.type};base64,${image.content}`;
    return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
  }
  sendImages() {
    this.spinner.show();
    const selectedImages = this.images.filter(image => image.selected); // Get only selected images
  
    if (selectedImages.length === 0) {
      this.showToast('No images selected!');
      this.spinner.hide();
      return;
    }
  
    const body: any = {
      Name: 'SendImagesShoppingCenters',
      MainEntity: null,
      Params: {
        images: selectedImages,
        ContactId: 15549,
      },
      Json: null,
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        this.showToast('Selected images sent successfully!');
      },
      error: (err) => {
        console.error('Error sending images:', err);
        this.spinner.hide();
        this.showToast('Failed to send selected images!');
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
