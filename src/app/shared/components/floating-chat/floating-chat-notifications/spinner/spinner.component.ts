import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './spinner.component.css',
})
export class SpinnerComponent implements OnInit {
  objectForScan: any;
  scanningmessage!: string;
  isLastStep!: boolean;
  shoppingCenter: any;
  dots = new Array(6);
  isScanning: boolean = false;
  isready!: boolean;
  insertsuccess!: boolean;
  campaigns: ICampaign[] = [];
  selectedCampaignIds: number[] = [];
  campaignSpecs: any;
  propertySpecs: any;
  matchedPlaces: boolean = false;
  matchedState: boolean = false;
  matchedCity: boolean = false;
  expandedCampaigns: { [id: number]: boolean } = {};
  campaignDetails: { [id: number]: CampaignComparisonDetails } = {};
  isInserting = false;
  @Input() sourceUrl: any;

  constructor(
    private placesService: PlacesService,
    private cdRef: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    (window as any).electronMessage?.onSiteScanMessage((object: any) => {
      if (!this.isLastStep) {
        this.isScanning = true;
      }
      this.objectForScan = object;
      this.scanningmessage = object.message;
      this.shoppingCenter = object.data;
      this.isLastStep = object.isLastStep;
      if (this.isLastStep && !this.shoppingCenter) {
        this.scanningmessage = 'Emily is Ready For Your Questions!';
        this.isready = true;
        setTimeout(() => {
          this.isScanning = false;
        }, 2500);
      } else if (this.isLastStep && this.shoppingCenter) {
        this.isready = true;
        this.GetUserCampaigns();
      }
    });
  }

  toggleCampaignDetails(id: number): void {
    this.expandedCampaigns[id] = !this.expandedCampaigns[id];

    if (this.expandedCampaigns[id] && !this.campaignDetails[id]) {
      this.GetCampaignFullDetails(id);
    }
  }
  onCampaignChange(event: any, campaignId: number): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      if (!this.selectedCampaignIds.includes(campaignId)) {
        this.selectedCampaignIds.push(campaignId);
      }
    } else {
      this.selectedCampaignIds = this.selectedCampaignIds.filter(
        (id) => id !== campaignId
      );
    }

    this.cdRef.detectChanges();
  }
  getSelectedCampaignsText(): string {
    if (this.selectedCampaignIds.length === 0) {
      return 'Select campaigns...';
    }

    if (this.selectedCampaignIds.length === this.campaigns.length) {
      return 'All campaigns selected';
    }

    const selectedCount = this.selectedCampaignIds.length;
    return `${selectedCount} campaign${selectedCount > 1 ? 's' : ''} selected`;
  }
  GetUserCampaigns(): void {
    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.campaigns = response.json as ICampaign[];
          console.log('this.campaigns', this.campaigns);
        } else {
          this.campaigns = [];
        }
      },
    });
  }
  GetCampaignFullDetails(id: any) {
    const body: any = {
      Name: 'GetCampaignFullDetails',
      Params: { CampaignId: id },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const campaignSpecs = res.json;
        const propertySpecs = this.shoppingCenter;
        console.log('campaignSpecs', campaignSpecs);
        console.log('propertySpecs', propertySpecs);

        const matchedPlaces =
          !!propertySpecs.Availability && propertySpecs.Availability.length > 0;

        const matchedState =
          campaignSpecs.Locations?.some(
            (loc: any) => loc.State === propertySpecs.CenterState
          ) || false;

        const matchedCity =
          campaignSpecs.Locations?.some(
            (loc: any) => loc.CityName === propertySpecs.CenterCity
          ) || false;
        console.log('matchedCity', matchedCity);
        console.log('matchedState', matchedState);
        console.log('matchedPlaces', matchedPlaces);

        this.campaignDetails[id] = {
          campaignSpecs,
          propertySpecs,
          matchedPlaces,
          matchedState,
          matchedCity,
        };
      },
    });
  }
  checkPropertyTypeMatch(details: CampaignComparisonDetails): boolean {
    const { propertySpecs, campaignSpecs } = details;

    if (!propertySpecs || !propertySpecs.Availability) return false;
    const needsLease = !!campaignSpecs.ForLease;
    const needsSale = !!campaignSpecs.ForSale;
    for (const space of propertySpecs.Availability) {
      if (!space || !space.LeaseType) continue;
      const leaseType = String(space.LeaseType).toLowerCase();
      if (needsLease && leaseType === 'lease') {
        return true;
      }
      if (needsSale && leaseType === 'sale') {
        return true;
      }
    }
    return false;
  }
  getCampaignCities(details: CampaignComparisonDetails): string[] {
    const campaignSpecs = details.campaignSpecs;
    if (!campaignSpecs?.Locations) return [];
    return campaignSpecs.Locations.filter((loc: any) => loc.CityName).map(
      (loc: any) => loc.CityName
    );
  }
  checkSizeMatch(details: CampaignComparisonDetails): boolean {
    const propertySpecs = details.propertySpecs;
    const campaignSpecs = details.campaignSpecs;

    if (
      !propertySpecs?.Availability ||
      propertySpecs.Availability.length === 0
    ) {
      return false;
    }

    return propertySpecs.Availability.some((availability: any) => {
      const size = availability.BuildingSizeSf;
      return (
        size >= campaignSpecs.MinUnitSize && size <= campaignSpecs.MaxUnitSize
      );
    });
  }
  checkStateTypeMatch(details: CampaignComparisonDetails): boolean {
    const propertySpecs = details.propertySpecs;
    const campaignSpecs = details.campaignSpecs;

    if (!campaignSpecs?.Locations) return false;

    return campaignSpecs.Locations.some(
      (loc: any) => loc.State === propertySpecs.CenterState
    );
  }
  checkCityTypeMatch(details: CampaignComparisonDetails): boolean {
    const propertySpecs = details.propertySpecs;
    const campaignSpecs = details.campaignSpecs;

    if (!campaignSpecs?.Locations) return false;

    return campaignSpecs.Locations.some(
      (loc: any) => loc.CityName === propertySpecs.CenterCity
    );
  }
  InsertSCCampaign(): void {
    this.isready = false;
    this.isInserting = true;
    this.insertsuccess = true;
    this.scanningmessage = 'Shopping  Center added successfully!';

    setTimeout(() => {
      this.isready = true;
      this.scanningmessage = 'Emily is Ready For Your Questions!';
    }, 2000);
    if (!this.shoppingCenter || this.selectedCampaignIds.length === 0) {
      console.warn('No shopping center or campaigns selected');
      return;
    }
    if (this.sourceUrl) {
      (window as any).electronMessage.removeSiteScanJson(this.sourceUrl);
    }

    if (Array.isArray(this.shoppingCenter.campaignIds)) {
      this.shoppingCenter.campaignIds = [...this.selectedCampaignIds];
    } else {
      this.shoppingCenter.campaignIds = [...this.selectedCampaignIds];
    }

    const body = this.shoppingCenter;
    console.log('Sending ShoppingCenter JSON:', body);

    this.placesService.InsertSC(body).subscribe({
      next: (response) => {
        console.log('InsertSC response', response);
        this.isready = true;

        const insertedSCId = Number(response?.result);
        if (!isNaN(insertedSCId) && insertedSCId > 0) {
          this.InsertAutomation(insertedSCId);
        }

        this.isScanning = false;
        this.selectedCampaignIds = [];
      },
      error: (error) => {
        console.error('InsertSC error', error);
        this.scanningmessage =
          'Error adding shopping center. Please try again.';

        setTimeout(() => {
          this.scanningmessage = 'Emily is Ready For Your Questions!';
          this.isScanning = false;
        }, 3000);
      },
    });
  }
  InsertAutomation(id: any) {
    this.placesService.InsertAutomation(id).subscribe({
      next: () => {},
    });
  }
  cancelInsertion() {
    this.isScanning = false;
    this.selectedCampaignIds = [];
    this.scanningmessage = 'Emily is Ready For Your Questions!';

    if (this.sourceUrl) {
      (window as any).electronMessage.removeSiteScanJson(this.sourceUrl);
    }
  }
}
