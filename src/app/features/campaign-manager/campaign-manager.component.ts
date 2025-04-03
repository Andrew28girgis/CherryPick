import {
  Component,
   OnInit,
   TemplateRef,
  HostListener,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  ICampaign,
  Stage,
  Submission,
} from 'src/app/shared/models/icampaign';
import  { EmilyService } from 'src/app/core/services/emily.service';
import  { Router } from '@angular/router';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-campaign-manager',
  templateUrl: './campaign-manager.component.html',
  styleUrls: ['./campaign-manager.component.css'],
})
export class CampaignManagerComponent implements OnInit {
  userBuyBoxes: { id: number; name: string }[] = [];
  selectedBuyBoxId = 0;
  campaigns: ICampaign[] = [];
  filteredCampaigns?: ICampaign[];
  stages: { id: number; stageName: string }[] = [];
  searchCampaign = '';
  viewMode: 'table' | 'card' = 'table';
  isMobile = false;

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private emilyService: EmilyService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
       { label: 'Campaigns', url: '/campaigns' }
    ]);
    this.getAllCampaigns();
    this.getUserBuyBoxes();

    // Check if there's a saved preference for view mode
    const savedViewMode = localStorage.getItem('campaignViewMode') as
      | 'table'
      | 'card';
    if (savedViewMode && !this.isMobile) {
      this.viewMode = savedViewMode;
    }
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
    // On mobile, always use the responsive card view
    if (this.isMobile) {
      this.viewMode = 'card';  // Automatically switch to card view for mobile
    } else {
      // For larger screens, check localStorage for user preference
      const savedViewMode = localStorage.getItem('campaignViewMode') as 'table' | 'card';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  toggleView(mode: 'table' | 'card'): void {
    if (!this.isMobile) {
      this.viewMode = mode;
      // Save preference in localStorage
      localStorage.setItem('campaignViewMode', mode);
    }
  }

  toggleExpand(campaign: any): void {
    campaign.expanded = !campaign.expanded;
  }

 

  getAllCampaigns(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        this.campaigns = response.json;
        this.filteredCampaigns = response.json;
      } else {
        this.campaigns = [];
        this.filteredCampaigns = [];
      }
      this.getKanbanTemplateStages();
    });
  }

  onSearchCampaign(): void {
    if (this.searchCampaign && this.searchCampaign.trim().length > 0) {
      this.filteredCampaigns = this.campaigns.filter((c) =>
        c.Campaigns.some((campaign) =>
          campaign.CampaignName.toLowerCase().includes(
            this.searchCampaign.toLowerCase()
          )
        )
      );
    } else {
      this.filteredCampaigns = this.campaigns;
    }
  }

  getUserBuyBoxes(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        this.userBuyBoxes = response.json.map((buybox: any) => {
          return {
            id: buybox.id,
            name: buybox.name,
          };
        });
        this.selectedBuyBoxId = this.userBuyBoxes[0].id;
      } else {
        this.userBuyBoxes = [];
      }
    });
  }

  onCampaignCreated(): void {
    this.getAllCampaigns();
    this.modalService.dismissAll();
  }

  openAddCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  goToEmily(campaign: ICampaign, index: number, withOrg: boolean): void {
    if (withOrg) {
      this.getCampaignOrganizations(campaign.id, campaign.Campaigns[index].Id);
    } else {
      const emilyObject: { buyboxId: number[]; organizations: any[] } = {
        buyboxId: [campaign.id],
        organizations: [],
      };
      this.emilyService.updateCheckList(emilyObject);

      this.router.navigate(['/MutipleEmail']);
    }
  }

  getKanbanTemplateStages(): void {
    const body: any = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 5 },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        this.stages = response.json;
      }
    });
  }

  getCampaignOrganizations(buboxId: number, campaignId: number): void {
    const body: any = {
      Name: 'GetCampaignOrganizations',
      Params: { CampaignId: campaignId },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
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
        this.router.navigate(['/MutipleEmail']);
      }
    });
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

 
  
}
