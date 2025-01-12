import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

interface FileItem {
  name: string;
  uploadedBy: {
    name: string;
    avatar: string;
  };
  uploadDate: Date;
  size: number;
}

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.css']
})
export class ArchiveComponent implements OnInit {
  files: FileItem[] = [];
  isDragging = false;
  activeTab: string = 'Done';
  sidebarCollapsed: boolean = false;
  isLoading = false;
  showUploadModal = false;
  newFileName = '';
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor() { }

  ngOnInit(): void { 
    this.loadProperties();
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  private loadProperties(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 0);
  }
  openUploadModal(): void {
    this.showUploadModal = true;
    this.selectedFile = null;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.newFileName = '';
    this.selectedFile = null;
  }
  removeSelectedFile(): void {
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
  }


  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  addFile(): void {
    if (this.selectedFile) {
      const fileItem: FileItem = {
        name: this.newFileName || this.selectedFile.name,
        uploadedBy: {
          name: 'You',
          avatar: 'Y'
        },
        uploadDate: new Date(),
        size: this.selectedFile.size
      };
      this.files.unshift(fileItem);
      this.closeUploadModal();
    }
  }
  private handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (!this.files.some(f => f.name === file.name)) {
        const fileItem: FileItem = {
          name: this.newFileName || file.name,
          uploadedBy: {
            name: 'You',
            avatar: 'Y'
          },
          uploadDate: new Date(),
          size: file.size
        };
        this.files.unshift(fileItem);
      }
    });
    this.newFileName = '';
  }

  removeFile(file: FileItem) {
    const index = this.files.findIndex(f => f.name === file.name);
    if (index !== -1) {
      this.files.splice(index, 1);
    }
  }

  editFile(file: FileItem) {
    console.log('Edit file:', file.name);
  }

  deleteFile(file: FileItem) {
    this.removeFile(file);
  }

  showFileInfo(file: FileItem) {
    console.log('Show info for:', file.name);
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }
}