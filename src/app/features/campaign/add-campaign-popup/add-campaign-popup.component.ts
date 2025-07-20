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
  @Input() popupTitle: string = 'Launch Your Campaign';
  @Input() secondaryButtonText: string = 'Cancel';
  @Output() onSecondaryButtonClicked = new EventEmitter<boolean>();

  protected campaignName: string = '';
  protected isPrivateCampaign: number = 1;
  protected visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;
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
        window.location.href = `https://www.google.com/maps?campaignId=${response.json[0].id}&campaignName=${this.campaignName}&organizationId=${this.organizationId}`;
      } else {
        this.activeModalService.close();
      }
    });
  }

  protected closeActiveModal(): void {
    this.onSecondaryButtonClicked.emit(true);
    this.activeModalService.close();
  }
}
