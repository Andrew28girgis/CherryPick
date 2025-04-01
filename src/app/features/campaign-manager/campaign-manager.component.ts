import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Campaign,
  ICampaign,
  Stage,
  Submission,
} from 'src/app/shared/models/icampaign';
import { CampaignDrawingComponent } from '../campaign-drawing/campaign-drawing.component';
import { Organization } from 'src/app/shared/models/orgnizations';
import { EmilyService } from 'src/app/core/services/emily.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaign-manager',
  templateUrl: './campaign-manager.component.html',
  styleUrl: './campaign-manager.component.css',
})
export class CampaignManagerComponent implements OnInit {
  userBuyBoxes: { id: number; name: string }[] = [];
  selectedBuyBoxId: number = 0;
  campaigns: ICampaign[] = [];
  filteredCampaigns?: ICampaign[];
  stages: { id: number; stageName: string }[] = [];
  searchCampaign: string = '';

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private emilyService: EmilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAllCampaigns();
    this.getUserBuyBoxes();
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
      // this.spinner.hide();

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

  // calculatePolygonCenters(geo: Geojson): number {
  //   let count = 0;
  //   geo.ShoppingCenters.forEach((sc) => {
  //     if (sc.InPolygon) {
  //       count++;
  //     }
  //   });
  //   return count;
  // }

  // calculatePolygonsCentersCount(geos: Geojson[]): number {
  //   let count = 0;
  //   geos.forEach((geo) =>
  //     geo.ShoppingCenters.forEach((sc) => {
  //       if (sc.InPolygon) {
  //         count++;
  //       }
  //     })
  //   );
  //   return count;
  // }

  // getUniqueStates(geo: Geojson[]): string[] {
  //   return [...new Set(geo.map((g) => g.state))];
  // }

  goToEmily(campaign: ICampaign, index: number, withOrg: boolean): void {
    if (withOrg) {
      this.getCampaignOrganizations(campaign.id, campaign.Campaigns[index].Id);
    } else {
      let emilyObject: { buyboxId: number[]; organizations: any[] } = {
        buyboxId: [campaign.id],
        organizations: [],
      };
      this.emilyService.updateCheckList(emilyObject);

      this.router.navigate(['/MutipleEmail']);
    }
  }

  getKanbanTemplateStages(): void {
    const body: any = {
      Name: 'GetKanbanTemplateStages  ',
      Params: { KanbanTemplateId: 5 },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        this.stages = response.json;
      }
    });
  }

  getStageOrganizationCount(
    stageName: string,
    stages?: Stage[]
  ): number | null {
    if (stages) {
      return (
        stages.find(
          (stage) => stage.stageName.toLowerCase() == stageName.toLowerCase()
        )?.Organizations || null
      );
    }
    return null;
  }

  getCampaignOrganizations(buboxId: number, campaignId: number): void {
    const body: any = {
      Name: 'GetCampaignOrganizations',
      Params: { CampaignId: campaignId },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        let organizationsIds = [
          ...new Set(response.json.map((o: any) => o.organizationId)),
        ];
        let organizations: {
          id: number;
          contacts: any[];
        }[] = organizationsIds.map((id) => {
          return { id: id as number, contacts: [] };
        });

        let emilyObject: { buyboxId: number[]; organizations: any[] } = {
          buyboxId: [buboxId],
          organizations: organizations,
        };
        this.emilyService.updateCheckList(emilyObject);

        this.router.navigate(['/MutipleEmail']);
      }
      //   let organizationsIds: number[] = [];
      // organizationsIds = [...new Set(organizationsIds)];

      // let organizations: {
      //   id: number;
      //   contacts: any[];
      // }[] = [];
      // organizations = organizationsIds.map((id) => {
      //   return { id: id, contacts: [] };
      // });

      // let emilyObject: { buyboxId: number[]; organizations: any[] } = {
      //   buyboxId: [campaign.id],
      //   organizations: organizations,
      // };
      // this.emilyService.updateCheckList(emilyObject);

      // this.router.navigate(['/MutipleEmail']);
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
