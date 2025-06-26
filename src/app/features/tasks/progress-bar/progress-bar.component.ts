import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ProgressBarComponent implements OnInit, OnDestroy {
  @Input() statusText: string = 'Catching in Progress...';
  @Input() mainText: string = 'Getting data from email';
  @Input() progress: number = 0;
  @Input() autoProgress: boolean = false;
  @Input() duration: number = 5000; // Duration in milliseconds
  
  @Output() progressComplete = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() progressChange = new EventEmitter<number>();

  private progressInterval?: number;

  ngOnInit() {
    if (this.autoProgress) {
      this.startAutoProgress();
    }
  }

  ngOnDestroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  onCancel() {
    this.cancelled.emit();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  startAutoProgress() {
    const increment = 100 / (this.duration / 100); // Update every 100ms
    
    this.progressInterval = window.setInterval(() => {
      this.progress += increment;
      this.progressChange.emit(this.progress);
      
      if (this.progress >= 100) {
        this.progress = 100;
        this.progressComplete.emit();
        if (this.progressInterval) {
          clearInterval(this.progressInterval);
        }
      }
    }, 100);
  }

  setProgress(value: number) {
    this.progress = Math.max(0, Math.min(100, value));
    this.progressChange.emit(this.progress);
    
    if (this.progress >= 100) {
      this.progressComplete.emit();
    }
  }

  reset() {
    this.progress = 0;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
} 