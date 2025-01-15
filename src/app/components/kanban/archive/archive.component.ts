import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
// import { renderAsync } from 'docx-preview';
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

interface ExcelData {
  headers: string[];
  rows: any[][];
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
 
  excelData: ExcelData | null = null;
  searchTerm: string = ''; // Added searchTerm property
  sortColumn: string = 'name'; // Added sortColumn property
  sortDirection: 'asc' | 'desc' = 'asc'; // Added sortDirection property
  showEditModal = false;
  fileToEdit: FileItem | null = null;
  editFileName = '';
  editMode: 'rename' | 'replace' = 'rename';
  replacementFile: File | null = null;
  replacementFileContent: string | null = null;
  isEditingContent = false;
  editableContent: string | null = null;

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
    this.searchTerm = ''; // Initialize searchTerm
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

  editFile(file: FileItem): void {
    this.fileToEdit = file;
    this.editFileName = file.name;
    this.editMode = 'rename';
    this.replacementFile = null;
    this.replacementFileContent = null;
    this.showEditModal = true;
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

  // async downloadFile(file: FileItem): Promise<void> {
  //   try {
  //     this.isLoading = true;

  //     if (!file.content) {
  //       throw new Error('File content not found');
  //     }

  //     // Convert Base64 string back to ArrayBuffer
  //     const binaryString = atob(file.content as string);
  //     const bytes = new Uint8Array(binaryString.length);
  //     for (let i = 0; i < binaryString.length; i++) {
  //       bytes[i] = binaryString.charCodeAt(i);
  //     }

  //     const blob = new Blob([bytes], { type: this.getMimeType(file.type) });
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = file.name;
      
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
      
  //   } catch (error) {
  //     console.error('Download failed:', error);
  //     this.showAlert('Failed to download file. Please try again.');
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }

 
  private formatPdfContent(content: string): string {
    // Basic formatting, you can enhance this further
    return content.replace(/\n/g, '<br>');
  }

  closeFileViewer(): void {
    if (this.fileViewerUrl) {
      URL.revokeObjectURL(this.fileViewerUrl.toString());
    }
    this.selectedFileForView = null;
    this.fileViewerUrl = null;
     this.excelData = null;
  }

  filterFiles(): FileItem[] { // Added filterFiles method
    let filteredFiles = this.files;
    if (this.searchTerm) {
      filteredFiles = filteredFiles.filter(file => 
        file.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    return this.sortFiles(filteredFiles);
  }

  sortFiles(files: FileItem[]): FileItem[] {
    return files.sort((a, b) => {
      let comparison = 0;
      switch (this.sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'uploadDate':
          comparison = a.uploadDate.getTime() - b.uploadDate.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  onReplacementFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file size (30MB limit)
      if (file.size > 30 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 30MB limit';
        this.replacementFile = null;
        element.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.xlsx'];
      const fileExtension = '.' + this.getFileExtension(file.name);
      if (!allowedTypes.includes(fileExtension)) {
        this.errorMessage = 'Only PDF, DOCX, and XLSX files are allowed';
        this.replacementFile = null;
        element.value = '';
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        this.replacementFile = file;
        if (e.target?.result) {
          const base64String = btoa(
            new Uint8Array(e.target.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          this.replacementFileContent = base64String;
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  removeReplacementFile(): void {
    this.replacementFile = null;
    this.replacementFileContent = null;
  }

  async saveEditedFile(): Promise<void> {
    if (!this.fileToEdit || !this.editFileName.trim()) {
      return;
    }

    const fileIndex = this.files.findIndex(f => f.id === this.fileToEdit!.id);
    if (fileIndex === -1) {
      return;
    }

    if (this.editMode === 'rename') {
      // Just update the name
      this.files[fileIndex] = {
        ...this.files[fileIndex],
        name: this.editFileName.trim()
      };
    } else if (this.editMode === 'replace' && this.replacementFile && this.replacementFileContent) {
      // Get the name without extension from the edited filename
      const nameWithoutExt = this.editFileName.trim().split('.')[0];
      
      // Get the extension from the replacement file
      const newExtension = this.getFileExtension(this.replacementFile.name);
      
      // Combine name and new extension
      const newFileName = `${nameWithoutExt}.${newExtension}`;

      // Replace the entire file
      this.files[fileIndex] = {
        ...this.files[fileIndex],
        name: newFileName,
        size: this.replacementFile.size,
        type: newExtension,
        content: this.replacementFileContent,
        uploadDate: new Date()
      };
    }

    // Save to local storage
    this.saveFilesToStorage();
    
    // Show success message
    this.showAlert('File updated successfully');
    
    // Close the modal
    this.closeEditModal();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.fileToEdit = null;
    this.editFileName = '';
  }

  handleContentEdit(event: Event): void {
    const target = event.target as HTMLDivElement;
    if (target) {
      this.editableContent = target.innerHTML;
    }
  }

  toggleEditContent(): void {
    this.isEditingContent = !this.isEditingContent;
  }

  async saveDocxContent(): Promise<void> {
    if (!this.selectedFileForView || !this.editableContent) return;

    try {
      const htmlDoc = new DOMParser().parseFromString(this.editableContent, 'text/html');
      const cleanHtml = htmlDoc.body.innerHTML;
      
      // Here we're storing the edited content as HTML in base64
      // In a real application, you might want to convert it back to DOCX format
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(cleanHtml);
      const base64Content = btoa(String.fromCharCode(...uint8Array));

      // Update the file content
      const fileIndex = this.files.findIndex(f => f.id === this.selectedFileForView!.id);
      if (fileIndex !== -1) {
        this.files[fileIndex] = {
          ...this.files[fileIndex],
          content: base64Content,
          uploadDate: new Date()
        };
        
        // Update the view
        this.docxContent = this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
        
        // Save to storage
        this.saveFilesToStorage();
        
        // Show success message
        this.showAlert('Document content updated successfully');
        
        // Exit edit mode
        this.isEditingContent = false;
      }
    } catch (error) {
      console.error('Error saving document content:', error);
      this.showAlert('Failed to save document content');
    }
  }

  cancelEditContent(): void {
    // Revert back to original content
    if (this.docxContent) {
      this.editableContent = (this.docxContent as any).changingThisBreaksApplicationSecurity;
    }
    this.isEditingContent = false;
  }
}

