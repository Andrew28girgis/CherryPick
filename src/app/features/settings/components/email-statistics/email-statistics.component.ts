import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';

interface Statistics {
  mailCount: number;
  contactCount: number;
  organizationCount: number;
  shoppingCentersCount: number;
  placeCount: number;
}

@Component({
  selector: 'app-email-statistics',
  templateUrl: './email-statistics.component.html',
  styleUrl: './email-statistics.component.css',
})
export class EmailStatisticsComponent implements OnInit, OnDestroy {
  private gemsCountSubscription!: Subscription;
  private gemsCountInterval!: number;
  private statProgressInterval!: number;

  protected stats: Statistics = {
    mailCount: 0,
    contactCount: 0,
    organizationCount: 0,
    shoppingCentersCount: 0,
    placeCount: 0,
  };
  protected gemsStates: any[] = ['idle', 'idle', 'idle', 'idle', 'idle'];
  protected gemsData: any[] = [
    { value: 0, label: 'Mails' },
    { value: 0, label: 'Contacts' },
    { value: 0, label: 'Organizations' },
    { value: 0, label: 'Shopping Centers' },
    { value: 0, label: 'Places' },
  ];
  protected currentMailsCount: number = 0;

  @Input() realEstateMailsCount!: number;

  @Output() cancel = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();

  // Configuration
  hidden = false;
  actionText = 'Processing your request...';

  // Diamond states and data

  // Progress tracking
  private currentProgress = 0;
  private targetProgress = 0;
  private progressInterval: any;
  private diamondInterval: any;
  private countInterval: any;
  private currentDiamond = 0;

  // Rainbow colors for the last diamond
  private rainbowColors = [
    '#FF0000',
    '#FF7F00',
    '#FFFF00',
    '#00FF00',
    '#0000FF',
    '#4B0082',
    '#9400D3',
  ];
  private currentColorIndex = 0;

  constructor(
    private readonly placesService: PlacesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.gemsCountInterval = setInterval(() => {
      this.getGemsCount();
    }, 1000);
    this.statProgressInterval = setInterval(() => {
      this.getCountOfReadMailsContent();
    }, 1000);

    this.startProgress();
  }

  ngOnDestroy() {
    this.clearIntervals();
  }

  private clearIntervals() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.diamondInterval) {
      clearInterval(this.diamondInterval);
    }
    if (this.countInterval) {
      clearInterval(this.countInterval);
    }
  }

  private startProgress() {
    // Start diamond animation sequence
    this.startDiamondAnimation();

    // Start progress bar animation
    // this.startProgressAnimation();

    // Start counter animation
    // this.startCounterAnimation();
  }

  private startDiamondAnimation() {
    this.diamondInterval = setInterval(() => {
      if (this.currentDiamond < this.gemsStates.length) {
        // Activate current diamond
        this.gemsStates[this.currentDiamond] = 'active';

        // Complete previous diamond after a delay
        if (this.currentDiamond > 0) {
          setTimeout(() => {
            this.gemsStates[this.currentDiamond - 1] = 'complete';
          }, 500);
        }

        this.currentDiamond++;

        // Update action text based on progress
        // this.updateActionText();
      } else {
        // Complete the last diamond
        setTimeout(() => {
          this.gemsStates[this.gemsStates.length - 1] = 'complete';
          this.onProgressComplete();
        }, 1000);

        clearInterval(this.diamondInterval);
      }
    }, 1000); // Each diamond activates every 2 seconds
  }

  private startProgressAnimation() {
    this.progressInterval = setInterval(() => {
      if (this.currentProgress < this.targetProgress) {
        this.currentProgress += Math.random() * 5 + 1;
        if (this.currentProgress > this.targetProgress) {
          this.currentProgress = this.targetProgress;
        }
      } else {
        // Set new target
        this.targetProgress = Math.min(
          100,
          this.targetProgress + Math.random() * 20 + 10
        );
      }
    }, 100);
  }

  private startCounterAnimation() {
    this.countInterval = setInterval(() => {
      this.gemsData.forEach((item, index) => {
        const increment = Math.floor(Math.random() * 10) + 1;
        item.value += increment;

        // Cap values at reasonable numbers
        const maxValues = [50, 25, 100, 75, 100];
        if (item.value > maxValues[index]) {
          item.value = maxValues[index];
        }
      });
    }, 800);
  }

  // private updateActionText() {
  //   const messages = [
  //     'Initializing process...',
  //     'Analyzing data structure...',
  //     'Processing components...',
  //     'Optimizing performance...',
  //     'Finalizing results...',
  //   ];

  //   const index = Math.min(this.currentDiamond - 1, messages.length - 1);
  //   if (index >= 0) {
  //     this.actionText = messages[index];
  //   }
  // }

  private onProgressComplete() {
    this.actionText = 'Process completed successfully!';
    setTimeout(() => {
      this.complete.emit();
    }, 1000);
  }

  // Template helper methods
  getDiamondTitle(index: number): string {
    const titles = ['Initialize', 'Analyze', 'Process', 'Optimize', 'Complete'];
    return titles[index] || `Step ${index + 1}`;
  }

  getDiamondColor(index: number): string {
    // For the rainbow diamond (index 4), cycle through colors
    if (index === 4) {
      const color = this.rainbowColors[this.currentColorIndex];
      this.currentColorIndex =
        (this.currentColorIndex + 1) % this.rainbowColors.length;
      return color;
    }

    // Default colors for other diamonds
    const colors = ['#FF961C', '#2F82FF', '#B158E7', '#FF6A8E', '#00FF00'];
    return colors[index] || '#E0E0E0';
  }

  formatNumber(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }

  calculateProgress(): number {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round((this.currentMailsCount / this.realEstateMailsCount) * 100)
      )
    );
  }

  onCancel(): void {
    this.clearIntervals();
    this.cancel.emit();
  }

  // Public methods to control the component
  public setProgress(progress: number): void {
    this.targetProgress = Math.min(100, Math.max(0, progress));
  }

  public setActionText(text: string): void {
    this.actionText = text;
  }

  public activateDiamond(index: number): void {
    if (index >= 0 && index < this.gemsStates.length) {
      this.gemsStates[index] = 'active';
    }
  }

  public completeDiamond(index: number): void {
    if (index >= 0 && index < this.gemsStates.length) {
      this.gemsStates[index] = 'complete';
    }
  }

  public hide(): void {
    this.hidden = true;
  }

  public show(): void {
    this.hidden = false;
  }

  public reset(): void {
    this.clearIntervals();
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.currentDiamond = 0;
    this.currentColorIndex = 0;
    this.gemsStates = ['idle', 'idle', 'idle', 'idle', 'idle'];
    this.gemsData.forEach((item) => (item.value = 0));
    this.actionText = 'Processing your request...';
    this.hidden = false;
  }

  private getGemsCount(): void {
    const body = {
      Name: 'GetGemsCount',
      Params: {},
    };

    this.gemsCountSubscription = this.placesService
      .GenericAPI(body)
      .subscribe((response) => {
        if (response.json && response.json.length > 0) {
          const data = response.json[0];
          this.stats = {
            mailCount: data.mailCount || 0,
            contactCount: data.contactCount || 0,
            organizationCount: data.organizationCount || 0,
            shoppingCentersCount: data.shoppingCentersCount || 0,
            placeCount: data.placeCount || 0,
          };

          this.gemsData[0].value = this.stats.mailCount;
          this.gemsData[1].value = this.stats.contactCount;
          this.gemsData[2].value = this.stats.organizationCount;
          this.gemsData[3].value = this.stats.shoppingCentersCount;
          this.gemsData[4].value = this.stats.placeCount;
        }
      });
  }

  private getCountOfReadMailsContent(): void {
    const body = {
      Name: 'GetCountOfReadMailsContent',
      Params: {
        Number: this.realEstateMailsCount,
      },
    };

    this.gemsCountSubscription = this.placesService
      .GenericAPI(body)
      .subscribe((response) => {
        if (response.json && response.json.length > 0) {
          const mailsCount = response.json[0].replyCount;
          this.currentMailsCount = mailsCount;
          if (this.realEstateMailsCount == mailsCount) {
            if (this.statProgressInterval) {
              clearInterval(this.statProgressInterval);
              clearInterval(this.gemsCountInterval);
              this.router.navigate(['/campaigns'], { replaceUrl: true });
            }
          }
        }
      });
  }
}
