import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/services/places.service';
import { Properties } from 'src/models/manage-prop';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-manage-properties',
  templateUrl: './manage-properties.component.html',
  styleUrl: './manage-properties.component.css',
})
export class ManagePropertiesComponent implements OnInit {
  properties: Properties[] = [];

  public files: NgxFileDropEntry[] = [];
  fileName!: string;
  @ViewChild('uploadPDF', { static: true }) uploadPDF!: TemplateRef<any>;
  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private httpClient: HttpClient
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

  public uploadFile(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          const formData = new FormData();
          formData.append('file', file, file.name);
          this.fileName = file.name;

          const SERVER_URL = `https://api.example.com/upload`;
          // const SERVER_URL = `http://10.0.0.15:8083/api/minmal/UploadOrgFile/1`;

          this.spinner.show();
          this.httpClient
            .post(SERVER_URL, formData, { responseType: 'text' })
            .subscribe(
              (res: string) => {
                console.log(res);
                this.spinner.hide();
                window.alert('PDF File uploaded successfully!');
                this.modalService.dismissAll();
              },
              (error) => {
                console.log(error);
                this.spinner.hide();
                window.alert('Failed to upload PDF file.');
              }
            );
        });
      } else {
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
      }
    }
  }
}
