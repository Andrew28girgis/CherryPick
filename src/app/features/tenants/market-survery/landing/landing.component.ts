import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
declare const google: any;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { ShoppingCenterTenant } from 'src/app/shared/models/PlaceCo';
import { OrgBranch } from 'src/app/shared/models/branches';
import { PlacesService } from 'src/app/core/services/places.service';
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  General!: General;
  mapViewOnePlacex!: boolean;
  PlaceId!: number;
  shoppingCenter!: LandingPlace;
  NearByType: NearByType[] = [];
  placeImage: string[] = [];
  ShoppingCenterId!: number;
  OrganizationBranches!: OrgBranch;
  OrgId!: number;
  shoppingId!: any;
  campaignId!: any;
  isMapView = true;
  tenantGroups = {
    onSite: [] as ShoppingCenterTenant[],
    veryShort: [] as ShoppingCenterTenant[],
    walking: [] as ShoppingCenterTenant[],
    longer: [] as ShoppingCenterTenant[],
  };
  categoryIcons: { [key: string]: string } = {};
  @ViewChild('galleryModal', { static: true }) galleryModal: any;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.shoppingId = params.get('shoppingId');
      this.campaignId = params.get('campaignId');
    });
    this.initializeParams();
    this.initializeDefaults();
  }

  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.campaignId = params.campaignId;
      this.PlaceId = params.id;
      this.ShoppingCenterId = params.shoppiongCenterId;
      if (this.ShoppingCenterId != 0) {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, 0);
        this.GetPlaceDetails(0, this.ShoppingCenterId);
      } else {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, this.PlaceId);

        this.GetPlaceDetails(this.PlaceId, 0);
      }
      this.GetPlaceCotenants();
    });
  }

  private initializeDefaults(): void {
    this.General = new General();
    this.shoppingCenter = new LandingPlace();
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        CampaignId: this.campaignId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenter = data.json?.[0] || null;
        this.initializeMap(
          this.shoppingCenter.Latitude,
          this.shoppingCenter.Longitude
        );
        this.initializestreetView(
          this.shoppingCenter.Latitude,
          this.shoppingCenter.Longitude
        );
        this.GetPlaceNearBy(this.PlaceId);
      },
    });
  }

  initializestreetView(
    lat: number,
    lng: number,
    heading?: number,
    pitch?: number
  ) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: pitch },
        }
      );
    } else {
    }
  }

  GetPlaceCotenants(): void {
    const body: any = {
      Name: 'GetPlaceCotenants',
      Params: {
        ShoppingCenterId: this.ShoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const tenants: ShoppingCenterTenant[] = data.json || [];

        this.tenantGroups = {
          onSite: tenants
            .filter((t) => t.Distance >= 0 && t.Distance < 100)
            .sort((a, b) => a.Distance - b.Distance),
          veryShort: tenants
            .filter((t) => t.Distance >= 100 && t.Distance < 400)
            .sort((a, b) => a.Distance - b.Distance),

          walking: tenants
            .filter((t) => t.Distance >= 400 && t.Distance < 800)
            .sort((a, b) => a.Distance - b.Distance),

          longer: tenants
            .filter((t) => t.Distance >= 800 && t.Distance <= 1200)
            .sort((a, b) => a.Distance - b.Distance),
        };
      },
    });
  }

  GetBuyBoxOrganizationDetails(
    Shoppingcenterid: number,
    PlaceId: number
  ): void {
    const body: any = {
      Name: 'GetBuyBoxOrganizationDetails',
      Params: {
        shoppingcenterid: +Shoppingcenterid,
        placeId: +PlaceId,
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json) {
          this.OrganizationBranches = data.json[0];
        }
      },
    });
  }

  GetPlaceNearBy(placeId: number): void {
    const body: any = {
      Name: 'GetNearBuyRetails',
      Params: {
        PlaceID: placeId,
        ShoppingCenterId: this.ShoppingCenterId,
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.NearByType = data.json;
      },
    });
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }

  async initializeMap(lat: number, lon: number): Promise<any> {
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('marker'),
    ]);

    const position = { lat: lat || 0, lng: lon || 0 };
    const map = new Map(document.getElementById('map') as HTMLElement, {
      center: position,
      zoom: 13,
      mapId: '1234567890abcdef',
    });
    const marker = new AdvancedMarkerElement({
      map: map,
      position: position,
      title: 'This is a marker!',
    });

    return map;
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  openGallery() {
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mapInPopup') as HTMLElement;
    if (!mapDiv) {
      return;
    }
    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    });

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }

  goBack() {
    window.history.back();
  }

  getBackgroundImage(): string {
    const imageUrl = this.shoppingCenter?.MainImage;
    return imageUrl ? `url(${imageUrl}) no-repeat center center / cover` : '';
  }

  getInitials(firstName: string, secondName: string): string {
    const name = firstName + ' ' + secondName;
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getInitial(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getCategoryIcon(category: string): string {
    if (!category) return this.categoryIcons['unknown'];
    const key = category.toLowerCase();
    if (this.categoryIcons[key]) {
      return this.categoryIcons[key];
    }
    for (const iconKey in this.categoryIcons) {
      if (key.includes(iconKey)) {
        return this.categoryIcons[iconKey];
      }
    }
    return this.categoryIcons['unknown'];
  }

  hasContacts(): boolean {
    return !!this.shoppingCenter?.Contacts?.some(
      (c) => c.FirstName || c.LastName || c.Email
    );
  }
}
