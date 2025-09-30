import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  files?: File[];
  uploading?: boolean;
}

@Component({
  selector: 'app-ai-chating',
  templateUrl: './ai-chating.component.html',
  styleUrls: ['./ai-chating.component.css'],
})
export class AiChatingComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  selectedFiles: File[] = [];
  uploadProgress: number = 0;
  isUploading: boolean = false;
  messageIdCounter: number = 1;

  // Supported file types
  supportedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  supportedPdfType = ['pdf'];
  maxFileSize = 10 * 1024 * 1024; // 10MB limit
  maxImages = 5;

  constructor(private http: HttpClient, private spinner: NgxSpinnerService) {}

  ngOnInit() {
    // Initialize with a welcome message
    this.addMessage(
      "Hello! I'm your AI assistant. How can I help you today?",
      false
    );
  }
  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Count existing files by type
    const currentPdfCount = this.selectedFiles.filter((f) =>
      this.supportedPdfType.includes(
        f.name.split('.').pop()?.toLowerCase() || ''
      )
    ).length;

    const currentImageCount = this.selectedFiles.filter((f) =>
      this.supportedImageTypes.includes(
        f.name.split('.').pop()?.toLowerCase() || ''
      )
    ).length;

    files.forEach((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isPdf = this.supportedPdfType.includes(fileExtension);
      const isImage = this.supportedImageTypes.includes(fileExtension);

      // Check if file type is supported
      if (!isPdf && !isImage) {
        errors.push(
          `"${file.name}" - Unsupported file type. Supported: PDF, JPG, JPEG, PNG, GIF, WEBP`
        );
        return;
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        errors.push(
          `"${file.name}" - File too large. Maximum size: ${this.formatFileSize(
            this.maxFileSize
          )}`
        );
        return;
      }

      // Check for duplicate files
      const fileExists = this.selectedFiles.some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size
      );

      if (fileExists) {
        errors.push(`"${file.name}" - File already selected`);
        return;
      }

      // Check PDF limit
      if (isPdf && currentPdfCount >= 1) {
        errors.push('You can only upload 1 PDF file');
        return;
      }

      // Check image limit
      if (isImage && currentImageCount >= this.maxImages) {
        errors.push(`You can only upload up to ${this.maxImages} images`);
        return;
      }

      validFiles.push(file);
    });

    // Add valid files
    this.selectedFiles = [...this.selectedFiles, ...validFiles];

    // Show errors if any
    if (errors.length > 0) {
      const errorMessage = 'File selection errors:\n' + errors.join('\n');
      this.addMessage(errorMessage, false);
    }

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles() {
    this.selectedFiles = [];
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

async sendMessage() {
    if (!this.currentMessage.trim() && this.selectedFiles.length === 0) {
      return;
    }

    // Add user message to chat
    const userMessage = this.addMessage(
      this.currentMessage,
      true,
      this.selectedFiles
    );

    // Prepare FormData payload
    const formData = new FormData();
    formData.append('Prompt', this.currentMessage || 'Analyze these files');

    // Separate files into PDF and images
    const pdfFiles = this.selectedFiles.filter(f => 
      this.supportedPdfType.includes(f.name.split('.').pop()?.toLowerCase() || '')
    );
    
    const imageFiles = this.selectedFiles.filter(f => 
      this.supportedImageTypes.includes(f.name.split('.').pop()?.toLowerCase() || '')
    );

    // Add PDF file (only first one if multiple)
    if (pdfFiles.length > 0) {
      formData.append('File', pdfFiles[0]);
    }

    // Convert images to base64 and add to formData
    if (imageFiles.length > 0) {
      const imageBase64Strings = await Promise.all(
        imageFiles.map(file => this.fileToBase64(file))
      );
      imageBase64Strings.forEach((base64, index) => {
        formData.append(`ImagesToConvert[${index}]`, base64);
      });
    }

    // Reset UI
    this.resetTextarea();
    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.clearFiles();

    // Set uploading state
    this.isUploading = true;
    userMessage.uploading = true;

    // Send to API
    this.http.post(`https://emily.app/api/BrokerWithChatGPT/TestPrompt`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((100 * event.loaded) / (event.total || 1));
        } else if (event.type === HttpEventType.Response) {
          this.handleApiResponse(event.body);
          this.isUploading = false;
          userMessage.uploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        this.handleApiError(error);
        this.isUploading = false;
        userMessage.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  private handleApiResponse(response: any) {
    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (data.response) {
        try {
          const parsedResponse = JSON.parse(data.response);
          this.addMessage(parsedResponse, false);
        } catch {
          this.addMessage(data.response, false);
        }
      } else {
        this.addMessage(data, false);
      }
    } catch (e) {
      this.addMessage(response, false);
    }
    this.scrollToBottom();
  }

  private handleApiError(error: any) {
    let errorMessage = 'Sorry, there was an error processing your request. Please try again.';

    if (error.status === 400 || error.status === 415) {
      const errorBody = error.error;
      if (typeof errorBody === 'string') {
        errorMessage = `❌ Error: ${errorBody}`;
      } else if (errorBody?.message) {
        errorMessage = `❌ Error: ${errorBody.message}`;
      }
    } else if (error.status === 413) {
      errorMessage = '❌ Error: Request too large. Please try with smaller data.';
    } else if (error.status === 0) {
      errorMessage = '❌ Error: Network connection failed. Please check your internet connection.';
    }

    this.addMessage(errorMessage, false);
    this.scrollToBottom();
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  resetTextarea() {
    const textarea = document.querySelector('.chat-input textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = '50px';
      textarea.style.overflowY = 'hidden';
    }
  }
  addMessage(content: string, isUser: boolean, files?: File[]): ChatMessage {
  // If content is an object, stringify it with formatting
  let displayContent = content;
  if (typeof content !== 'string') {
    try {
      displayContent = JSON.stringify(content, null, 2);
    } catch (e) {
      displayContent = 'Unable to display response';
    }
  }

  const message: ChatMessage = {
    id: this.messageIdCounter++,
    content: displayContent,
    isUser,
    timestamp: new Date(),
    files: files ? [...files] : undefined,
  };

  this.messages.push(message);
  setTimeout(() => this.scrollToBottom(), 100);
  return message;
}

  isPdf(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return this.supportedPdfType.includes(ext || '');
}

isImage(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return this.supportedImageTypes.includes(ext || '');
}

  scrollToBottom() {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📋';
      default:
        return '📎';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.resizeTextarea(textarea);
  }

  private resizeTextarea(textarea: HTMLTextAreaElement) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 500); // Max height 500px

    // Set the new height
    textarea.style.height = newHeight + 'px';

    // If content exceeds max height, show scrollbar
    if (textarea.scrollHeight > 400) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }
}
