import { Component, OnInit, TemplateRef } from '@angular/core';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import {
  Children,
  partitionParent,
  partitions,
} from 'src/app/shared/models/partitions';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.css'],
})
export class DataSourcesComponent implements OnInit {
  contactID!: any;
  isUploading = false;
  uploadProgress = 0;
  parentPaths: Set<string> = new Set();
  showModal = false;
  DirectoryNames: partitions[] = [];
  childrenPaths: Children[] = [];
  selectedDrive = '';
  selectedPartition = '';
  selectedFullPath = '';
  pathStack: string[] = [];
  private modalRef?: NgbModalRef;
  includeFiles: boolean = true;
  constructor(
    private breadcrumbService: BreadcrumbService,
    private placesService: PlacesService,
    public activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Data Sources', url: '/data-sources' },
    ]);
    this.contactID = localStorage.getItem('contactId');
  }

  openPartitionModal(content: TemplateRef<any>) {
    this.modalRef = this.modalService.open(content, { size: 'lg' });
    this.loadPartitions();

    this.modalRef.result.finally(() => {
      // Reset state when modal is closed or dismissed
      this.DirectoryNames = [];
      this.childrenPaths = [];
      this.selectedDrive = '';
      this.selectedPartition = '';
      this.selectedFullPath = '';
      this.pathStack = [];
    });
  }

  private loadPartitions() {
    this.spinner.show();
    this.http
      .get<partitions[]>('https://api.cherrypick.com/api/Directory/partitions')
      .subscribe({
        next: (drives) => {
          this.DirectoryNames = drives;
          this.childrenPaths = [];
          this.pathStack = [];
          this.spinner.hide();
        },
        error: (err) => {
          console.error(err);
          this.spinner.hide();
        },
      });
  }

  onPartitionSelect(partition: string) {
    this.selectedDrive = partition;
    this.pathStack = [partition];
    this.loadChildren(partition);
  }

  isFile(child: Children): boolean {
    return child.name.includes('.');
  }

  /** only drill down on folders now */
  onChildSelect(child: Children) {
    if (this.isFile(child)) {
      return; // do nothing for files
    }
    this.pathStack.push(child.fullPath);
    this.loadChildren(child.fullPath);
  }

  onBack() {
    if (this.pathStack.length > 1) {
      // pop current folder, load its parent
      this.pathStack.pop();
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      // at top of a partition → go back to partition list
      this.childrenPaths = [];
      this.pathStack = [];
      this.selectedPartition = '';
      this.selectedFullPath = '';
    }
  }

  private loadChildren(path: string) {
    this.spinner.show();
    const url = `https://api.cherrypick.com/api/Directory/children?parentPath=${encodeURIComponent(
      path
    )}`;
    this.http.get<partitionParent>(url).subscribe({
      next: (resp) => {
        this.selectedFullPath = resp.parentFullPath;
        this.selectedPartition = path;
        this.childrenPaths = resp.children;
        this.spinner.hide();
      },
      error: (err) => {
        console.error(err);
        this.spinner.hide();
      },
    });
  }

  sendPath() {
    if (!this.pathStack.length) {
      return;
    }

    this.spinner.show();
    const fullPath = this.pathStack[this.pathStack.length - 1];
    const body = {
      Name: 'AddDirectory',
      Params: {
        Path: fullPath,
        IncludeSubfolders: this.includeFiles,
      },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.modalService.dismissAll();
        this.showToast('Directory path sent successfully!');
      },
    });
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const allowed = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/xml',
      'application/xml',
    ];
    if (!allowed.includes(file.type)) {
      console.warn('Unsupported file type:', file.type);
      return;
    }

    const formData = new FormData();
    formData.append('filename', file, file.name);
    const dto = {
      IsUpdatedOnly: true,
    };
    formData.append('UploadFile', JSON.stringify(dto));

    const SERVER_URL = `https://api.cherrypick.com/api/uploadfile/${this.contactID}`;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.http
      .post(SERVER_URL, formData, {
        reportProgress: true,
        observe: 'events',
        responseType: 'text',
      })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(
              (100 * event.loaded) / event.total
            );
          } else if (event instanceof HttpResponse) {
            this.isUploading = false;
            const text = event.body as string;
            if (text.includes('successfully')) {
              console.log('✅ Success:', text);
            } else {
              console.warn('Unexpected response:', text);
            }
          }
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Upload failed:', err);
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
}
