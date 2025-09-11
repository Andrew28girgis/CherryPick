import {
  Component,
  OnInit,
  TemplateRef,
  HostListener,
  OnDestroy,
  Input,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { PlacesService } from 'src/app/core/services/places.service';
import {
  ICampaign,
  KanbanStage,
  Submission,
} from 'src/app/shared/models/icampaign';
import { EmilyService } from 'src/app/core/services/emily.service';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { Subscription } from 'rxjs';
import { AddCampaignPopupComponent } from '../add-campaign-popup/add-campaign-popup.component';
import { RefreshService } from 'src/app/core/services/refresh.service';

@Component({
  selector: 'app-campaign-manager',
  templateUrl: './campaign-manager.component.html',
  styleUrls: ['./campaign-manager.component.css'],
})
export class CampaignManagerComponent implements OnInit, OnDestroy {
  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;
  @Input() hideViewToggles: boolean = false;
  @Input() forceReload: boolean = false;
  @Input() set viewMode(value: 'card' | 'table') {
    if (!this.isMobile) {
      this._viewMode = value;
      localStorage.setItem('campaignViewMode', value);
    }
  }
  get viewMode(): 'card' | 'table' {
    return this._viewMode;
  }
  private _viewMode: 'card' | 'table' = 'card';

  userBuyBoxes: { id: number; name: string }[] = [];
  selectedBuyBoxId = 0;
  campaigns: ICampaign[] = [];
  filteredCampaigns?: ICampaign[];
  stages: { id: number; stageName: string }[] = [];
  searchCampaign = '';
  isMobile = false;
  private dataLoaded = false;

  // Loading state
  isLoading: boolean = true;
  // Skeleton arrays for different views
  skeletonCardArray = Array(6).fill(0);
  skeletonTableArray = Array(10).fill(0);
  skeletonStagesArray = Array(4).fill(0);
  // Subscription to manage and clean up subscriptions
  private subscriptions = new Subscription();
  // Interval for hiding spinner

  constructor(
    private placesService: PlacesService,

    private modalService: NgbModal,
    private emilyService: EmilyService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private refreshService:RefreshService,
  ) {}

  ngOnInit(): void {
    // Only proceed if data hasn't been loaded before or if force reload is requested
    if (!this.dataLoaded || this.forceReload) {
      this.breadcrumbService.setBreadcrumbs([
        { label: 'Campaigns', url: '/campaigns' },
      ]);
      this.loadData();
    }
     this.refreshService.refreshOrganizations$.subscribe(() => {
      this.getAllCampaigns();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
    // On mobile, always use the responsive card view
    if (this.isMobile) {
      this.viewMode = 'card'; // Automatically switch to card view for mobile
    } else {
      // For larger screens, check localStorage for user preference
      const savedViewMode = localStorage.getItem('campaignViewMode') as
        | 'table'
        | 'card';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  toggleView(mode: 'table' | 'card'): void {
    this.viewMode = mode;
    // Save preference in localStorage
    localStorage.setItem('campaignViewMode', mode);
  }

  toggleExpand(campaign: any): void {
    campaign.expanded = !campaign.expanded;
  }

  getAllCampaigns(): void {
    this.isLoading = true;

    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.campaigns = response.json;
          this.filteredCampaigns = response.json;
        } else {
          this.router.navigate(['/summary'], { replaceUrl: true });
          this.campaigns = [];
          this.filteredCampaigns = [];
        }
        this.getKanbanTemplateStages();
        this.dataLoaded = true; // Set dataLoaded to true on successful load
      },
      error: () => {
        this.isLoading = false;
        this.dataLoaded = false;
      },
    });

    this.subscriptions.add(subscription);
  }

  onSearchCampaign(): void {
    if (this.searchCampaign && this.searchCampaign.trim().length > 0) {
      this.filteredCampaigns = this.campaigns.filter((c) =>
        c.CampaignName.toLowerCase().includes(this.searchCampaign.toLowerCase())
      );
    } else {
      this.filteredCampaigns = this.campaigns;
    }
  }

  // getUserBuyBoxes(): void {
  //   this.isLoading = true; // Show skeleton

  //   const body: any = {
  //     Name: 'GetUserBuyBoxes',
  //     Params: {},
  //   };

  //   const subscription = this.placesService.GenericAPI(body).subscribe({
  //     next: (response) => {
  //       if (response.json && response.json.length > 0) {
  //         this.userBuyBoxes = response.json.map((buybox: any) => {
  //           return {
  //             id: buybox.id,
  //             name: buybox.name,
  //           };
  //         });
  //         this.selectedBuyBoxId = this.userBuyBoxes[0].id;
  //       } else {
  //         this.userBuyBoxes = [];
  //       }
  //     },
  //     error: () => {},
  //   });

  //   this.subscriptions.add(subscription);
  // }

  onCampaignCreated(): void {
    this.getAllCampaigns();
    this.modalService.dismissAll();
  }

  openAddCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  goToEmily(campaign: ICampaign, index: number, withOrg: boolean): void {
    if (withOrg) {
      this.getCampaignOrganizations(campaign.OrganizationId, campaign.Id);
    } else {
      // const emilyObject: { buyboxId: number[]; organizations: any[] } = {
      //   buyboxId: [campaign.id],
      //   organizations: [],
      // };
      // this.emilyService.updateCheckList(emilyObject);
      // this.router.navigate(['/MutipleEmail', campaign.id]);
    }
  }

  getKanbanTemplateStages(): void {
    this.isLoading = true; // Show skeleton
    const body: any = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 },
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.stages = response.json;
        }
        this.isLoading = false; // Hide skeleton
      },
      error: () => {
        this.isLoading = false; // Hide skeleton on error
      },
    });

    this.subscriptions.add(subscription);
  }

  getCampaignOrganizations(buboxId: number, campaignId: number): void {
    this.isLoading = true; // Show skeleton

    const body: any = {
      Name: 'GetCampaignOrganizations',
      Params: { CampaignId: campaignId },
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          const organizationsIds = [
            ...new Set(response.json.map((o: any) => o.organizationId)),
          ];
          const organizations: {
            id: number;
            contacts: any[];
          }[] = organizationsIds.map((id) => {
            return { id: id as number, contacts: [] };
          });
          const emilyObject: { buyboxId: number[]; organizations: any[] } = {
            buyboxId: [buboxId],
            organizations: organizations,
          };
          this.emilyService.updateCheckList(emilyObject);
          this.router.navigate(['/MutipleEmail', campaignId]);
        }
        this.isLoading = false; // Hide skeleton
      },
      error: () => {
        this.isLoading = false; // Hide skeleton on error
      },
    });

    this.subscriptions.add(subscription);
  }

  sortedSubmissions(submissions: Submission[]) {
    return (
      submissions?.sort(
        (a, b) =>
          this.statusSortOrder(a.StatusId) - this.statusSortOrder(b.StatusId)
      ) || []
    );
  }

  statusSortOrder(statusId: number | undefined): number {
    const order: { [key: number]: number } = { 0: 0, 1: 1, [-1]: 2 };
    return order[statusId ?? -1];
  }

  getStatusClass(statusId: number | undefined) {
    return {
      red: statusId === -1,
      normal: statusId === 0,
      green: statusId === 1,
    };
  }

  getSubmissionsCountNew(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == 0).length;
  }

  getSumbmissionsCountAcceppted(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == 1).length;
  }

  getSumbmissionsCountRejected(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == -1).length;
  }

  getKanbanCount(stageName: string, kanbansList: KanbanStage[]): number {
    const kanbanStage = kanbansList?.find(
      (k) => k.stageName.toLowerCase() === stageName.toLowerCase()
    );
    return kanbanStage && kanbanStage.MarketSurveyShoppingCenters[0]?.Id
      ? kanbanStage.MarketSurveyShoppingCenters.length
      : 0;
  }

  private loadData(): void {
    this.getAllCampaigns();
    // this.getUserBuyBoxes();

    // Check if there's a saved preference for view mode
    const savedViewMode = localStorage.getItem('campaignViewMode') as
      | 'table'
      | 'card';
    if (savedViewMode && !this.isMobile) {
      this.viewMode = savedViewMode;
    }

    this.dataLoaded = true;
  }

  onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }
  checkImage(event: Event) {
    const img = event.target as HTMLImageElement;
  
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    try {
      ctx.drawImage(img, 0, 0);
  
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  
      let isWhite = true;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (!(r > 240 && g > 240 && b > 240 && a > 0)) {
          isWhite = false;
          break;
        }
      }
  
      if (isWhite) {
        img.src = 'assets/Images/placeholder.png';
      }
  
    } catch (err) {
      console.warn("Canvas image data blocked due to CORS:", err);
      // Fallback: if the image is very small (like a white dot), use placeholder
      if (img.naturalWidth <= 5 && img.naturalHeight <= 5) {
        img.src = 'assets/Images/placeholder.png';
      }
    }
  }
  protected openCampaignModal(): void {
    this.modalService.open(AddCampaignPopupComponent, { centered: true });
  }

  protected navigateToCampaign(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/campaigns/add-campaign'], {
      queryParams: {
        minSize: this.campaignMinSize,
        maxSize: this.campaignMaxSize,
      },
    });
  }
  stageClass(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('accept') || n.includes('approved') || n.includes('success')) return 'is-accepted';
    if (n.includes('reject') || n.includes('decline') || n.includes('failed')) return 'is-rejected';
    if (n.includes('new') || n.includes('pending') || n.includes('open')) return 'is-new';
    return 'is-neutral';
  }
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
}
