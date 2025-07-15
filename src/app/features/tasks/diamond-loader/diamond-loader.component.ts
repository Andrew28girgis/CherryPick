import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface CountData {
  mailCount: number;
  contactCount: number;
  organizationCount: number;
  shoppingCentersCount: number;
  placeCount: number;
}

@Component({
  selector: 'app-diamond-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diamond-loader.component.html',
  styleUrls: ['./diamond-loader.component.css'],
})
export class DiamondLoaderComponent implements OnInit {
  @Input() progress: number = 0;
  @Input() actionText: string = '';
  @Input() counts: any;
  @Input() totalProgressedMessage: any;
  @Output() cancel = new EventEmitter<void>();

  diamondStates: string[] = ['idle', 'idle', 'idle', 'idle', 'idle'];
  countItems: { label: string; value: number }[] = [];
  previousCounts: CountData | null = null;
  private interval: any;
  private readonly ANIMATION_DURATION = 1500; // Time for active animation
  private readonly COMPLETION_DURATION = 1000; // Additional time for completion animation
  private readonly TOTAL_ANIMATION_TIME =
    this.ANIMATION_DURATION + this.COMPLETION_DURATION;
  totalMailsCount: number = 0;
  private updateInterval: any;
  hidden: boolean = false;

  ngOnInit() {
    this.totalMailsCount = this.GetTotalMailsCount();
  }

  getDiamondTitle(index: number): string {
    const titles = [' ', ' ', ' ', ' ', ' '];
    return titles[index];
  }

  getDiamondColor(index: number): string {
    return 'url(#paint0_radial_10_25)';
  }

  getDiamondDescription(index: number): string {
    return ''; // Return empty string since we're not showing descriptions
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['counts']) {
      // Initialize previous counts if null
      if (!this.previousCounts) {
        this.previousCounts = { ...this.counts };
        this.startInitialAnimation();
      } else {
        // Compare and update only changed diamonds
        this.updateChangedDiamonds();
      }

      this.countItems = [
        { label: 'Mails', value: this.counts.mailCount },
        { label: 'Contacts', value: this.counts.contactCount },
        { label: 'Organizations', value: this.counts.organizationCount },
        { label: 'Shopping Centers', value: this.counts.shoppingCentersCount },
        { label: 'Places', value: this.counts.placeCount },
      ];
    }
  }

  private startInitialAnimation() {
    // Reset states
    this.diamondStates = ['idle', 'idle', 'idle', 'idle', 'idle'];

    // Clear any existing interval
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Animate each diamond sequentially
    this.diamondStates.forEach((_, index) => {
      const startDelay = index * this.TOTAL_ANIMATION_TIME;

      setTimeout(() => {
        this.diamondStates[index] = 'active';

        setTimeout(() => {
          this.diamondStates[index] = 'complete';
        }, this.ANIMATION_DURATION);
      }, startDelay);
    });
  }

  private updateChangedDiamonds() {
    const changes = this.getChangedValues();

    changes.forEach((index) => {
      // Only animate if the diamond isn't already animating
      if (this.diamondStates[index] === 'complete') {
        this.animateSingleDiamond(index);
      }
    });

    // Update previous counts after processing changes
    this.previousCounts = { ...this.counts };
  }

  private getChangedValues(): number[] {
    const changedIndices: number[] = [];

    if (this.previousCounts!.mailCount !== this.counts.mailCount) {
      changedIndices.push(0);
    }
    if (this.previousCounts!.contactCount !== this.counts.contactCount) {
      changedIndices.push(1);
    }
    if (
      this.previousCounts!.organizationCount !== this.counts.organizationCount
    ) {
      changedIndices.push(2);
    }
    if (
      this.previousCounts!.shoppingCentersCount !==
      this.counts.shoppingCentersCount
    ) {
      changedIndices.push(3);
    }
    if (this.previousCounts!.placeCount !== this.counts.placeCount) {
      changedIndices.push(4);
    }

    return changedIndices;
  }

  private animateSingleDiamond(index: number) {
    this.diamondStates[index] = 'active';

    setTimeout(() => {
      this.diamondStates[index] = 'complete';
    }, this.ANIMATION_DURATION);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  onCancel() {
    this.hidden = true;
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  calculateProgress(): number {
    if (
      !this.counts ||
      this.totalProgressedMessage === undefined ||
      !this.counts.mailCount
    ) {
      return 0;
    }

    // Convert to numbers and ensure they are valid
    const progressedMessage = Number(this.totalProgressedMessage);
    const mailCount = Number(this.counts.mailCount);

    if (isNaN(progressedMessage) || isNaN(mailCount) || mailCount === 0) {
      return 0;
    }

    const progress = Math.min(
      Math.round((mailCount / progressedMessage) * 100),
      100
    );
    return progress;
  }

  GetTotalMailsCount(): number {
    if (!this.counts) return 0;
    return Object.values(this.counts).reduce(
      (sum: number, count: any) => sum + (count || 0),
      0
    );
  }
}
