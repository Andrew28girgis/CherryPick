import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { Tenant } from 'src/app/shared/models/tenant';

@Component({
  selector: 'app-add-campaign-popup',
  templateUrl: './add-campaign-popup.component.html',
  styleUrl: './add-campaign-popup.component.css',
})
export class AddCampaignPopupComponent implements OnInit {
  @Input() organizationId!: number;
  @Input() organizationName!: number;
  @Input() popupTitle: string = 'Launch Your Campaign';
  @Input() secondaryButtonText: string = 'Cancel';
  @Output() onSecondaryButtonClicked = new EventEmitter<boolean>();
  campaignId!: number;
  selectedState: string = 'washington dc';
  protected campaignName: string = '';
  protected isPrivateCampaign: number = 1;
  protected visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  protected campaignMinSize: number = 500;
  protected campaignMaxSize: number = 500;
  protected allOrganizations!: Tenant[];
  protected displayOrganizationsList: boolean = false;

  constructor(
    private activeModalService: NgbActiveModal,
    private placesService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (!this.organizationId) {
      this.displayOrganizationsList = true;
      this.getAllOrganizations();
    }
  }

  private getAllOrganizations(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetAllOrganizations',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        this.allOrganizations = response.json;
      } else {
        this.allOrganizations = [];
      }
    });
  }

  protected createNewCampaign(): void {
    const body: any = {
      Name: 'CreateCampaign ',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        OrganizationId: this.organizationId,
        minunitsize: this.campaignMinSize,
        maxunitsize: this.campaignMaxSize,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0 && response.json[0].id) {
        const campaignId = response.json[0].id;
        this.campaignId = campaignId;
        this.navigateToMap();
        // const url = 'https://www.google.com/maps/search/shopping+centers+malls';
        // window.location.href = `${url}?campaignId=${response.json[0].id}&campaignName=${this.campaignName}&organizationId=${this.organizationId}`;
        this.electronMessageWithStateName();
      } else {
        this.activeModalService.close();
      }
    });
  }

    electronMessageWithStateName() {
    (window as any).electronMessage.getLinksFromGoogle(
      this.selectedState,
      localStorage.getItem('token'),
      this.campaignId,
    );
    const url = 'https://www.google.com';
    window.location.href = `${url}`;
  }

  protected closeActiveModal(): void {
    this.onSecondaryButtonClicked.emit(true);
    this.activeModalService.close();
  }
    navigateToMap(): void {
    const url = 'https://www.google.com/maps/search/shopping+centers+malls';
    window.location.href = `${url}?campaignId=${this.campaignId}&campaignName=${this.organizationName}&organizationId=${this.organizationId}`;
  }
}
