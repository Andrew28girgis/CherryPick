import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { CampaignDrawingComponent } from '../campaign-drawing/campaign-drawing.component';

@Component({
  selector: 'app-campaign-manager',
  templateUrl: './campaign-manager.component.html',
  styleUrl: './campaign-manager.component.css',
})
export class CampaignManagerComponent implements OnInit {
  userBuyBoxes: { id: number; name: string }[] = [];
  selectedBuyBoxId: number = 0;
  campaigns: ICampaign[] = [];
  filteredCampaigns: ICampaign[] = [];
  searchCampaign: string = '';

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getUserBuyBoxes();
    this.getAllCampaigns();
  }

  getAllCampaigns(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();

      if (response.json && response.json.length > 0) {
        this.campaigns = response.json;
        this.filteredCampaigns = response.json;
      } else {
        this.campaigns = [];
        this.filteredCampaigns = [];
      }
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
      this.spinner.hide();

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
    this.modalService.dismissAll();
    this.getAllCampaigns();
  }

  openAddCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }
}
