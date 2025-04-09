import { Component, OnInit } from '@angular/core';
import { IcampaignData } from './models/icampaign-data';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin, Observable } from 'rxjs';
import { IcampaignSubmission } from './models/icampaign-submission';
import { IcampaignReaction } from './models/icampaign-reaction';
import { IcampaignComment } from './models/icampaign-comment';
import { ICampaignOrgCadence } from './models/icampaign-org-cadence';
import { ICampaignSiteCadence } from './models/icampaign-site-cadence';

@Component({
  selector: 'app-ataglance',
  templateUrl: './ataglance.component.html',
  styleUrl: './ataglance.component.css',
})
export class AtaglanceComponent implements OnInit {
  campaignId!: number;
  campaignData!: IcampaignData;
  campaignSubmissions: IcampaignSubmission[] = [];
  campaignReactions: IcampaignReaction[] = [];
  campaignComments: IcampaignComment[] = [];
  campaignOrgCadence!: ICampaignOrgCadence;
  campaignSiteCadence!: ICampaignSiteCadence;
  componentLoaded: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private placeService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.campaignId = +id;
      }
    });

    this.initializeAtaglance();
  }

  initializeAtaglance(): void {
    this.spinner.show();
    forkJoin({
      campaign: this.getCampaignData(),
      submissions: this.getCampaignSubmissions(),
      reactions: this.getCampaignReactions(),
      comments: this.getCampaignComments(),
      orgCadence: this.getCampaignOrgCadence(),
      siteCadence: this.getCampaignSiteCadence(),
    }).subscribe({
      next: (result) => {
        this.spinner.hide();

        if (result.campaign.json && result.campaign.json.length > 0) {
          this.campaignData = result.campaign.json[0];
        }

        if (result.submissions.json && result.submissions.json.length > 0) {
          this.campaignSubmissions = result.submissions.json;
        }

        if (result.reactions.json && result.reactions.json.length > 0) {
          this.campaignReactions = result.reactions.json;
        }

        if (result.comments.json && result.comments.json.length > 0) {
          this.campaignComments = result.comments.json;
        }

        if (result.orgCadence.json && result.orgCadence.json.length > 0) {
          this.campaignOrgCadence = result.orgCadence.json[0];
        }

        if (result.siteCadence.json && result.siteCadence.json.length > 0) {
          this.campaignSiteCadence = result.siteCadence.json[0];
        }

        this.componentLoaded = true;
      },
      error: (err) => {
        console.error('Error:', err);
      },
    });
  }

  getCampaignData(): Observable<any> {
    const body = {
      name: 'GetCampaignDetails',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }

  getCampaignSubmissions(): Observable<any> {
    const body = {
      name: 'GetCampaignSubmissions',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }

  getCampaignReactions(): Observable<any> {
    const body = {
      name: 'GetCampaignReactions',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }

  getCampaignComments(): Observable<any> {
    const body = {
      name: 'GetCampaignComments',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }

  getCampaignOrgCadence(): Observable<any> {
    const body = {
      name: 'GetStagesOrgs',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }

  getCampaignSiteCadence(): Observable<any> {
    const body = {
      name: 'GetStagesShoppingCenters',
      params: {
        CampaignId: this.campaignId,
      },
    };
    return this.placeService.GenericAPI(body);
  }
}
