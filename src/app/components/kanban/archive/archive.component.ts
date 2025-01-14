import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { renderAsync } from 'docx-preview';
import { CommonModule } from '@angular/common';

interface FileItem {
  id: string;
  name: string;
  uploadedBy: {
    name: string;
    avatar: string;
  };
  uploadDate: Date;
  size: number;
  type: string;
  status: 'uploading' | 'complete' | 'error';
  downloadUrl?: string;
  content?: string | ArrayBuffer;
}

interface MammothResult {
  value: string;
  messages: any[];
}

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.css'],
  standalone: false,
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
  isUploading = false;
  uploadProgress = 0;
  errorMessage: string | null = null;
  alertMessage: string | null = null;
  alertTimeout: any = null;
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedRows: Set<string> = new Set();
  fileContent: string | ArrayBuffer | null = null;
  selectedFileForView: FileItem | null = null;
  fileViewerUrl: SafeResourceUrl | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.loadFilesFromStorage();
  }

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
    this.newFileName = '';
    this.errorMessage = null;
    this.uploadProgress = 0;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.newFileName = '';
    this.selectedFile = null;
    this.errorMessage = null;
    this.uploadProgress = 0;
    this.isUploading = false;
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
    this.errorMessage = null;
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file size (30MB limit)
      if (file.size > 30 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 30MB limit';
        this.selectedFile = null;
        element.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.xlsx'];
      const fileExtension = file.name.toLowerCase().slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);
      if (!allowedTypes.includes('.' + fileExtension)) {
        this.errorMessage = 'Only PDF, DOCX, and XLSX files are allowed';
        this.selectedFile = null;
        element.value = '';
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedFile = file;
        if (e.target?.result) {
          // Convert ArrayBuffer to Base64 string
          const base64String = btoa(
            new Uint8Array(e.target.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          this.fileContent = base64String;
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile || !this.fileContent) {
      this.errorMessage = 'Please select a file to upload';
      return;
    }

    try {
      this.isUploading = true;
      await this.simulateFileUpload();

      const fileItem: FileItem = {
        id: Date.now().toString(),
        name: this.newFileName || this.selectedFile.name,
        uploadedBy: {
          name: 'You',
          avatar: 'Y'
        },
        uploadDate: new Date(),
        size: this.selectedFile.size,
        type: this.getFileExtension(this.selectedFile.name),
        status: 'complete',
        content: this.fileContent // Save the content
      };

      this.files.unshift(fileItem);
      this.saveFilesToStorage();
      this.closeUploadModal();
    } catch (error) {
      console.error('Upload failed:', error);
      this.errorMessage = 'Failed to upload file. Please try again.';
    }
  }

  private async simulateFileUpload(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.uploadProgress = 0;
      const interval = setInterval(() => {
        this.uploadProgress += 5;
        if (this.uploadProgress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
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

  addFile(): void {
    if (this.selectedFile) {
      const fileItem: FileItem = {
        id: Date.now().toString(),
        name: this.newFileName || this.selectedFile.name,
        uploadedBy: {
          name: 'You',
          avatar: 'Y'
        },
        uploadDate: new Date(),
        size: this.selectedFile.size,
        type: this.getFileExtension(this.selectedFile.name),
        status: 'complete'
      };
      this.files.unshift(fileItem);
      this.closeUploadModal();
    }
  }
  private async handleFiles(files: FileList) {
    this.clearAlert();
    
    for (const file of Array.from(files)) {
      // Validate file size (30MB limit)
      if (file.size > 30 * 1024 * 1024) {
        this.showAlert('File size exceeds 30MB limit');
        continue;
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.xlsx'];
      const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
      if (!allowedTypes.includes(fileExtension)) {
        this.showAlert('Only PDF, DOCX, and XLSX files are allowed');
        continue;
      }

      try {
        // Read file content and convert to Base64
        const base64Content = await this.readFileAsBase64(file);
        
        const fileItem: FileItem = {
          id: Date.now().toString(),
          name: this.newFileName || file.name,
          uploadedBy: {
            name: 'You',
            avatar: 'Y'
          },
          uploadDate: new Date(),
          size: file.size,
          type: this.getFileExtension(file.name),
          status: 'complete',
          content: base64Content
        };
        
        this.files.unshift(fileItem);
      } catch (error) {
        console.error('Error processing file:', error);
        this.showAlert(`Failed to process file: ${file.name}`);
      }
    }
    
    this.saveFilesToStorage();
    this.newFileName = '';
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64String = btoa(
            new Uint8Array(e.target.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          resolve(base64String);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  removeFile(file: FileItem) {
    const index = this.files.findIndex(f => f.id === file.id);
    if (index !== -1) {
      this.files.splice(index, 1);
      this.saveFilesToStorage();
    }
  }

  editFile(file: FileItem) {
    console.log('Edit file:', file.name);
  }

  deleteFile(file: FileItem) {
    this.removeFile(file);
    this.saveFilesToStorage();
  }

  showFileInfo(file: FileItem) {
    console.log('Show info for:', file.name);
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  private loadFilesFromStorage(): void {
    const savedFiles = localStorage.getItem('archiveFiles');
    if (savedFiles) {
      this.files = JSON.parse(savedFiles).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      }));
    }
  }

  private saveFilesToStorage(): void {
    localStorage.setItem('archiveFiles', JSON.stringify(this.files));
  }

  clearStorage(): void {
    localStorage.removeItem('archiveFiles');
    this.files = [];
  }

  private showAlert(message: string) {
    this.alertMessage = message;
    
    // Clear any existing timeout
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    
    // Set new timeout to clear the alert after 4 seconds
    this.alertTimeout = setTimeout(() => {
      this.clearAlert();
    }, 4000);
  }

  private clearAlert() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    this.alertMessage = null;
  }

  isAllSelected(): boolean {
    return this.files.length > 0 && this.selectedRows.size === this.files.length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selectedRows.clear();
    } else {
      this.files.forEach(file => this.selectedRows.add(file.id));
    }
  }

  isRowSelected(file: FileItem): boolean {
    return this.selectedRows.has(file.id);
  }

  toggleRow(file: FileItem): void {
    if (this.selectedRows.has(file.id)) {
      this.selectedRows.delete(file.id);
    } else {
      this.selectedRows.add(file.id);
    }
  }

  async downloadFile(file: FileItem): Promise<void> {
    try {
      this.isLoading = true;

      if (!file.content) {
        throw new Error('File content not found');
      }

      // Convert Base64 string back to ArrayBuffer
      const binaryString = atob(file.content as string);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: this.getMimeType(file.type) });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      this.showAlert('Failed to download file. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  private getMimeType(fileType: string): string {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
  }

  viewFile(file: FileItem): void {
    this.selectedFileForView = file;
    const fileType = this.getFileExtension(file.name).toLowerCase();
    
    if (!file.content) {
      this.showAlert('File content not found');
      return;
    }

    try {
      const binaryString = atob(file.content as string);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: this.getMimeType(file.type) });
      const url = URL.createObjectURL(blob);
      this.fileViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      
    } catch (error) {
      console.error('Error creating preview:', error);
      this.showAlert('Failed to create file preview');
    }
  }

  closeFileViewer(): void {
    if (this.fileViewerUrl) {
      URL.revokeObjectURL(this.fileViewerUrl.toString());
    }
    this.selectedFileForView = null;
    this.fileViewerUrl = null;
  }
}





