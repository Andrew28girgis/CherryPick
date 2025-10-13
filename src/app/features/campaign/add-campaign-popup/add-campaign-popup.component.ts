import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { Tenant } from 'src/app/shared/models/tenant';
import { Offcanvas } from 'bootstrap';

@Component({
  selector: 'app-add-campaign-popup',
  templateUrl: './add-campaign-popup.component.html',
  styleUrl: './add-campaign-popup.component.css',
})
export class AddCampaignPopupComponent implements OnInit {
  @Input() organizationId!: number;
  @Input() organizationName!: string;
  @Input() popupTitle: string = 'Launch Your Campaign';
  @Input() secondaryButtonText: string = 'Cancel';
  @Output() onSecondaryButtonClicked = new EventEmitter<boolean>();
  @Output() requestCloseOffcanvas = new EventEmitter<void>();
  campaignId!: number;
  states: Array<{ stateName: string; stateCode: string }> = [];
  selectedState: string | null = null;
  selectedStateName: string | null = null;
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
  closeOffcanvasFn!: () => void;

  constructor(
    private activeModalService: NgbActiveModal,
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.getAllStates();
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
      Name: 'CreateCampaign',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        OrganizationId: this.organizationId,
        minunitsize: this.campaignMinSize,
        maxunitsize: this.campaignMaxSize,
        // StateName: this.selectedStateName,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0 && response.json[0].id) {
        const campaignId = response.json[0].id;
        this.campaignId = campaignId;
        // this.navigateToMap();
        this.requestCloseOffcanvas.emit();
        this.navigateToShoppingCenterAndOpenUpload(campaignId);
        // const url = 'https://www.google.com/maps/search/shopping+centers+malls';
        // window.location.href = `${url}?campaignId=${response.json[0].id}&campaignName=${this.campaignName}&organizationId=${this.organizationId}`;
        // this.electronMessageWithStateName();
      } else {
        this.activeModalService.close();
      }
    });
  }

  // electronMessageWithStateName() {
  //   (window as any).electronMessage.getLinksFromGoogle(
  //     this.selectedState,
  //     localStorage.getItem('token'),
  //     this.campaignId
  //   );
  // }

  protected closeActiveModal(): void {
    this.onSecondaryButtonClicked.emit(true);
    this.activeModalService.close();
  }
  navigateToMap(): void {
    const url = 'https://www.google.com/maps/search/shopping+centers+malls';
    window.location.href = `${url}?campaignId=${this.campaignId}&campaignName=${this.organizationName}&organizationId=${this.organizationId}`;
  }

  private getAllStates(): void {
    const body: any = {
      Name: 'GetAllStates',
      Params: {},
    };

    this.placesService.BetaGenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        this.states = response.json;
      } else {
        this.states = [];
      }
    });
  }

  private navigateToShoppingCenterAndOpenUpload(campaignId: number) {
    if (this.closeOffcanvasFn) this.closeOffcanvasFn();
  
    const orgId = this.organizationId;
    const orgName = (this.organizationName || '').trim() || 'org';
  
    this.router.navigate(
      ['/dashboard', orgId, encodeURIComponent(orgName), campaignId],
      { queryParams: { openUpload: true } }
    );
  
    this.activeModal.close();
  }
  
  
  
  closeOffcanvas() {
    const offcanvasEl = document.getElementById('addCampaignOffcanvas');
    if (offcanvasEl) {
      const bsOffcanvas =
        Offcanvas.getInstance(offcanvasEl) || new Offcanvas(offcanvasEl);
      bsOffcanvas.hide();
    }
  }
  onOrgChanged(id: any) {
    // coerce to number because <option [value]> gives a string
    const orgId = Number(id);
    this.organizationId = orgId;
  
    const org = this.allOrganizations?.find(o => o.id === orgId);
    this.organizationName = org?.name || '';  // <-- capture name from select
  }
  
}
