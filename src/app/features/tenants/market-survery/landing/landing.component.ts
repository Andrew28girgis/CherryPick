import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
declare const google: any;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { ShoppingCenterTenant } from 'src/app/shared/models/PlaceCo';
import { OrgBranch } from 'src/app/shared/models/branches';
import { PlacesService } from 'src/app/core/services/places.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription, take } from 'rxjs';
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
  campaignName!: string;
  isMapView = true;
  tenantGroups = {
    onSite: [] as ShoppingCenterTenant[],
    veryShort: [] as ShoppingCenterTenant[],
    walking: [] as ShoppingCenterTenant[],
    longer: [] as ShoppingCenterTenant[],
  };
  categoryIcons: { [key: string]: string } = {};
  @ViewChild('galleryModal', { static: true }) galleryModal: any;
  filteredCenters: any[] = [];
  centerIds: number[] = [];
  currentIndex = -1;
  nextName = '';
  prevName = '';
  private subscriptions = new Subscription();
  CampaignScores: any[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private viewManagerService: ViewManagerService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.shoppingId = params.get('shoppingId');
      this.campaignId = params.get('campaignId');
      if (this.campaignId === 'undefined') {
        this.campaignId = null;
      }

      if (this.campaignId) {
        try {
          await this.viewManagerService.loadShoppingCenters(this.campaignId);

          this.viewManagerService.filteredCenters$
            .pipe(take(1))
            .subscribe((centers) => {
              this.filteredCenters = centers || [];
              this.rebuildSequence();
              this.cdr.detectChanges();
            });
        } catch (error) {}
      } else {
        this.loadShoppingCenters();
      }
    });

    this.initializeParams();
    this.initializeDefaults();
  }

  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.campaignId = params.campaignId;
      if (this.campaignId === 'undefined') {
        this.campaignId = null;
      }
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
    this.GetShoppingCenterCampaignScore();
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

        if (this.shoppingCenter.Latitude && this.shoppingCenter.Longitude) {
          this.initializeMap(
            this.shoppingCenter.Latitude,
            this.shoppingCenter.Longitude
          );
          this.initializestreetView(
            this.shoppingCenter.Latitude,
            this.shoppingCenter.Longitude
          );
        }

        this.GetPlaceNearBy(this.PlaceId);
      },
    });
  }
  editingPlaceId: number | null = null;
  editModel: any = null;

  startEdit(place: any) {
    this.editingPlaceId = place.Id;
    this.editModel = {
      Id: place.Id,
      Suite: place.Suite ?? '',
      LeaseType: place.LeaseType ?? '',
      Price: place.Price ?? null,
      BuildingSizeSf: place.BuildingSizeSf ?? null,
      SecondaryType: place.SecondaryType ?? '',
    };
  }

  cancelEdit() {
    this.editingPlaceId = null;
    this.editModel = null;
  }

  saveEdit() {
    if (!this.editModel?.Id) return;
    this.UpdatePlace({
      Id: this.editModel.Id,
      Suite: this.editModel.Suite,
      LeaseType: this.editModel.LeaseType,
      Price: this.editModel.Price,
      BuildingSizeSf: this.editModel.BuildingSizeSf,
      SecondaryType: this.editModel.SecondaryType,
    });
    this.cancelEdit();
  }

  // accessibility: support Enter/Space on icons
  onKeyActivate(evt: KeyboardEvent, action: () => void) {
    const k = evt.key;
    if (k === 'Enter' || k === ' ') {
      evt.preventDefault();
      action();
    }
  }

  UpdatePlace(place: any): void {
    const body = {
      Name: 'UpdatePlace',
      Params: {
        SecondaryType: place.SecondaryType,
        Suite: place.Suite,
        BuildingSizeSf: place.BuildingSizeSf,
        Price: place.Price,
        LeaseType: place.LeaseType,
        Id: place.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        this.GetPlaceDetails(this.PlaceId, this.ShoppingCenterId);
      },
    });
  }

  DeletePlace(placeId: number): void {
    const body = {
      Name: 'DeletePlace',
      Params: { Id: placeId },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        this.GetPlaceDetails(this.PlaceId, this.ShoppingCenterId);
      },
    });
  }

  initializestreetView(
    lat: number,
    lng: number,
    heading: number = 0,
    pitch: number = 0
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
    if (this.campaignId === 'undefined') {
      this.campaignId = null;
    }
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
    return this.shoppingCenter?.Contacts?.some(
      (c) => c.FirstName || c.LastName || c.Email
    );
  }
  get hasPrev(): boolean {
    return this.currentIndex > 0;
  }
  get hasNext(): boolean {
    return (
      this.currentIndex >= 0 && this.currentIndex < this.centerIds.length - 1
    );
  }

  // Helper method to get center name by ID
  private getCenterNameById(id: number): string {
    const center = this.filteredCenters.find(
      (c) => Number(c.Id ?? c.scId) === id
    );
    return center?.CenterName || center?.centerName || 'Unknown Center';
  }

  private rebuildSequence(): void {
    this.centerIds = (this.filteredCenters || [])
      .map((c) => Number(c.Id ?? c.scId))
      .filter((id) => !isNaN(id));

    const currentIdNum = Number(this.ShoppingCenterId);
    this.currentIndex = this.centerIds.indexOf(currentIdNum);

    // Calculate next and previous names with circular navigation
    if (this.centerIds.length > 0 && this.currentIndex >= 0) {
      // Next index (circular)
      const nextIndex =
        this.currentIndex >= this.centerIds.length - 1
          ? 0
          : this.currentIndex + 1;
      const nextId = this.centerIds[nextIndex];
      this.nextName = this.getCenterNameById(nextId);
      console.log('hhh', this.nextName);

      // Previous index (circular)
      const prevIndex =
        this.currentIndex <= 0
          ? this.centerIds.length - 1
          : this.currentIndex - 1;
      const prevId = this.centerIds[prevIndex];
      this.prevName = this.getCenterNameById(prevId);
      console.log('ttt', this.prevName);
    } else {
      this.nextName = '';
      this.prevName = '';
    }
  }

  goToNext(): void {
    if (!this.centerIds?.length) return;

    // If at the last index → go to the first one
    const nextIndex =
      this.currentIndex >= this.centerIds.length - 1
        ? 0
        : this.currentIndex + 1;

    const nextId = this.centerIds[nextIndex];
    console.log('nextId:', nextId);

    this.currentIndex = nextIndex;

    this.router.navigate([
      '/landing',
      this.PlaceId,
      nextId,
      this.campaignId == null ? 'undefined' : this.campaignId,
    ]);
    this.GetShoppingCenterCampaignScore(nextId);
  }

  goToPrevious(): void {
    if (!this.centerIds?.length) return;

    const prevIndex =
      this.currentIndex <= 0
        ? this.centerIds.length - 1
        : this.currentIndex - 1;

    const prevId = this.centerIds[prevIndex];
    console.log('prevId:', prevId);

    this.currentIndex = prevIndex;

    this.router.navigate([
      '/landing',
      this.PlaceId,
      prevId,
      this.campaignId == null ? 'undefined' : this.campaignId,
    ]);
    this.GetShoppingCenterCampaignScore(prevId);
  }

  loadShoppingCenters(): void {
    const params = {
      Name: 'GetShoppingCenters',
      Params: {},
    };

    this.PlacesService.GenericAPI(params).subscribe((response: any) => {
      if (response && response.json) {
        this.filteredCenters = response.json.map(
          (center: any, index: number) => ({
            ...center,
            id: center.id || index + 1,
          })
        );
        this.rebuildSequence();
      }
    });
  }
  isLink(value: string): boolean {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  GetShoppingCenterCampaignScore(Id?: number) {
    const body = {
      Name: 'GetShoppingCenterCampaignScore',
      Params: {
        ShoppingCenterId: Id ? Id : this.ShoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        console.log('API Response:', res.json);
        this.CampaignScores = res.json || [];
        this.campaignName = this.CampaignScores.filter(
          (c) => c.campaignId == this.campaignId
        )[0]?.campaignName;
      },
      error: (err) => {},
    });
  }
}
