import { Component, OnInit, Input, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Children, partitions } from 'src/app/shared/models/partitions';
import { NonGenericService } from 'src/app/core/services/non-generic.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.css'],
})
export class FileExplorerComponent implements OnInit {
  @Input() contactID: any;
  @Output() fileSelected = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('fileExplorerModal') fileExplorerModal!: TemplateRef<any>;

  DirectoryNames: partitions[] = [];
  childrenPaths: Children[] = [];
  selectedDrive = '';
  selectedPartition = '';
  selectedFullPath = '';
  pathStack: string[] = [];
  currentStep: 'pdf' = 'pdf';
  pdfPath: string = '';
  private modalRef?: NgbModalRef;
  private navigationHistory: string[] = [];
  private currentHistoryIndex: number = -1;
  forwardHistory: string[] = [];
  sanitizedPdfUrl: SafeResourceUrl | null = null;
  showPreview: boolean = false;
  previewFile: Children | null = null;

  constructor(
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private nonGenericService: NonGenericService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  // Public method to open the modal from parent component
  openModal() {
    this.currentStep = 'pdf';
    this.pdfPath = '';
    this.modalRef = this.modalService.open(this.fileExplorerModal, { size: 'lg' });
    this.loadPartitions();

    this.modalRef.result.finally(() => {
      this.resetModalState();
      this.onClose.emit();
    });
  }

  private resetModalState() {
    this.DirectoryNames = [];
    this.childrenPaths = [];
    this.selectedDrive = '';
    this.selectedPartition = '';
    this.selectedFullPath = '';
    this.pathStack = [];
    this.currentStep = 'pdf';
    this.pdfPath = '';
    this.sanitizedPdfUrl = null;
  }

  private loadPartitions() {
    this.spinner.show();
    this.nonGenericService.getPartitions().subscribe({
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
    this.forwardHistory = [];
    this.loadChildren(partition);
  }

  isFile(child: Children): boolean {
    return child.name.includes('.');
  }

  isValidFileType(child: Children): boolean {
    if (!this.isFile(child)) return false;
    const fileName = child.name.toLowerCase();
    return fileName.endsWith('.pdf');
  }

  isImageFile(child: Children): boolean {
    if (!this.isFile(child)) return false;
    const fileName = child.name.toLowerCase();
    return fileName.endsWith('.jpg') || 
           fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || 
           fileName.endsWith('.gif');
  }

  onChildSelect(child: Children) {
    if (this.isFile(child)) {
      const fileExtension = child.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'pdf') {
        this.selectedFullPath = child.fullPath;
      } else {
        this.showToast('Please select a PDF file');
      }
      return;
    }
    this.forwardHistory = [];
    this.pathStack.push(child.fullPath);
    this.loadChildren(child.fullPath);
  }

  togglePreview(event: Event, child: Children) {
    event.stopPropagation();
    if (this.isFile(child) && child.name.toLowerCase().endsWith('.pdf')) {
      this.previewFile = child;
      this.showPreview = true;
      this.selectedFullPath = child.fullPath;
      this.createPdfPreviewUrl(child.fullPath);
    }
  }

  closePreview() {
    this.showPreview = false;
    this.previewFile = null;
    this.sanitizedPdfUrl = null;
  }

  private createPdfPreviewUrl(filePath: string) {
    this.sanitizedPdfUrl = null;
    
    const fileUrl = `file://${filePath}`;
    this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }

  onBack() {
    if (this.pathStack.length > 1) {
      const currentPath = this.pathStack[this.pathStack.length - 1];
      this.forwardHistory.push(currentPath);
      this.pathStack.pop();
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.goToRoot();
    }
  }

  private loadChildren(path: string) {
    this.spinner.show();
    this.nonGenericService.getChildren(path).subscribe({
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

  selectFile() {
    if (!this.selectedFullPath) {
      this.showToast('Please select a PDF file');
      return;
    }

    this.fileSelected.emit(this.selectedFullPath);
    this.modalService.dismissAll();
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage && toast) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  onForward() {
    if (this.forwardHistory.length > 0) {
      const nextPath = this.forwardHistory.pop()!;
      this.pathStack.push(nextPath);
      this.loadChildren(nextPath);
    }
  }

  onUp() {
    if (this.pathStack.length > 1) {
      this.pathStack.pop();
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.goToRoot();
    }
  }

  refreshView() {
    if (this.selectedDrive) {
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.loadPartitions();
    }
  }

  goToRoot() {
    this.selectedDrive = '';
    this.selectedPartition = '';
    this.selectedFullPath = '';
    this.pathStack = [];
    this.childrenPaths = [];
  }

  goToPath(index: number) {
    if (index < this.pathStack.length - 1) {
      const removedPaths = this.pathStack.slice(index + 1);
      this.forwardHistory = [...removedPaths.reverse(), ...this.forwardHistory];
      
      const newPath = this.pathStack[index];
      this.pathStack = this.pathStack.slice(0, index + 1);
      this.loadChildren(newPath);
    }
  }

  getFileType(fileName: string): string {
    if (!fileName) return 'File';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      default:
        return 'File';
    }
  }

  getItemCount(): number {
    if (!this.selectedDrive) {
      return this.DirectoryNames.length;
    }
    return this.childrenPaths.length;
  }

  closeModal() {
    this.modalService.dismissAll();
  }
}