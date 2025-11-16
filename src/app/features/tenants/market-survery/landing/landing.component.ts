import { Component, TemplateRef, ViewChild } from '@angular/core';
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
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

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
  filteredCenters = signal<any[]>([]);
  centerIds: number[] = [];
  currentIndex = -1;
  nextName = '';
  prevName = '';
  private subscriptions = new Subscription();
  CampaignScores: any[] = [];
  scoringId: number | null = null;
  selectedCampaignDetails: any = null;
  campaignLogo: string = '';
  @ViewChild('campaignDetailsModal') campaignDetailsModal!: TemplateRef<any>;
  parsedCampaignDetails: { key: string; value: any }[] = [];
  currentGalleryData = signal<string[]>([]);
  currentMainImage = signal<string>('');
  infoData: any = null;
  conclusion: any;
  score: any;
  isLoadingInfo = false;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private viewManagerService: ViewManagerService,
    private http: HttpClient
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
              this.filteredCenters.set(centers || []);
              this.rebuildSequence();
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
      Source: place.Source ?? '',
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
      Source: this.editModel.Source,
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
        Source: place.Source,
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

  openGallery(modalObject: any) {
    const images = modalObject.Images ? modalObject.Images.split(',') : [];
    this.currentGalleryData.set(images);
    this.currentMainImage.set(modalObject.MainImage || '');

    this.modalService.open(this.galleryModal, {
      size: 'xl',
      centered: true,
    });
  }
  selectMainImage(imageUrl: string): void {
    const body: any = {
      Name: 'SetImageAsMain',
      Params: { OldImage: imageUrl, Id: this.ShoppingCenterId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        this.showToast('Main image updated successfully!');

        this.shoppingCenter.MainImage = imageUrl;

        this.currentMainImage.set(imageUrl);

        this.currentGalleryData.update((images) => images.map((img) => img));

        this.shoppingCenter = {
          ...this.shoppingCenter,
          MainImage: imageUrl,
        };
      },
      error: () => {
        this.showToast('Failed to update main image.');
      },
    });
  }

  deleteImage(imageUrl: string): void {
    const body: any = {
      Name: 'DeleteImage',
      Params: { OldImage: imageUrl, Id: this.ShoppingCenterId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        this.showToast('Image deleted successfully!');

        this.currentGalleryData.update((images) =>
          images.filter((img) => img !== imageUrl)
        );

        if (this.shoppingCenter.Images) {
          const imgs = this.shoppingCenter.Images.split(',').filter(
            (i) => i !== imageUrl
          );
          this.shoppingCenter.Images = imgs.join(',');
        }

        if (this.currentMainImage() === imageUrl) {
          this.currentMainImage.set('');
          this.shoppingCenter.MainImage = '';
        }
        this.shoppingCenter = { ...this.shoppingCenter };
      },
    });
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
  getInitials2(name: string): string {
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

  private getCenterNameById(id: number): string {
    const centers = this.filteredCenters();
    const center = centers.find((c) => Number(c.Id ?? c.scId) === id);
    return center?.CenterName || center?.centerName || 'Unknown Center';
  }

  private rebuildSequence(): void {
    const centers = this.filteredCenters();
    this.centerIds = centers
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

      // Previous index (circular)
      const prevIndex =
        this.currentIndex <= 0
          ? this.centerIds.length - 1
          : this.currentIndex - 1;
      const prevId = this.centerIds[prevIndex];
      this.prevName = this.getCenterNameById(prevId);
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
        this.filteredCenters.set(
          response.json.map((center: any, index: number) => ({
            ...center,
            id: center.id || index + 1,
          }))
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
        this.CampaignScores = res.json || [];
        this.campaignName = this.CampaignScores.filter(
          (c) => c.campaignId == this.campaignId
        )[0]?.campaignName;
      },
      error: (err) => {},
    });
  }
  getscore(campaign: any) {
    if (!campaign.Score) {
      this.scoringId = campaign.campaignId;
    }
    this.PlacesService.GetScore(
      campaign.campaignId,
      this.ShoppingCenterId
    ).subscribe({
      next: (response) => {
        this.scoringId = null;
        this.viewManagerService.loadShoppingCenters(this.ShoppingCenterId);
        if (!response) {
          this.showToast(`Shopping center has already been scored`);
        } else {
          this.showToast(`Shopping center  scored successfully`);
        }
      },
      error: () => {
        this.scoringId = null; // also stop loader if error happens
      },
    });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToastsuccess');
    const toastMessage = document.getElementById('toastMessagesuccess');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);
    } else {
    }
  }
  //   viewSpecs(campaign: any) {
  //     this.showToast(
  //       `Campaign ${campaign.campaignName} specs are being fetched...`
  //     );

  //     const body: any = {
  //       Name: 'GetCampaignDetailsJSON',
  //       Params: { CampaignId: campaign.campaignId },
  //     };

  //     this.PlacesService.GenericAPI(body).subscribe({
  //       next: (response) => {
  //         this.PlacesService.sendmessages({
  //           Chat: `
  //           Show the Campaign and display all campaign specifications — every field in the JSON must be shown (no field should be ignored or hidden).
  //           Present all the data in a clean, organized HTML layout that’s easy for the user to read and navigate.
  //           The campaign name is "${campaign.campaignName}"
  //           Its ID is "${campaign.campaignId}"
  //           and aims to expand in the following locations from the JSON below:
  //           ${response.json[0].campaignDetailsJSON}
  //           Your goal is to show the full JSON data beautifully in HTML and help the user continue or complete any missing campaign specifications.
  // `,
  //           //The campaign belongs to the tenant "${campaign.OrganizationName}"
  //           NeedToSaveIt: true,
  //         }).subscribe({});
  //       },
  //     });
  //   }
  viewSpecsNew(campaign: any) {
    const body: any = {
      Name: 'GetCampaignFullDetails',
      Params: { CampaignId: campaign.campaignId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response) => {
        const data = response.json;
        this.selectedCampaignDetails = data;
        this.campaignLogo = data.LogoURL;

        try {
          const parsed = JSON.parse(data.CampaignDetailsJSON);
          this.parsedCampaignDetails = this.getKeyValuePairs(parsed);
        } catch {
          this.parsedCampaignDetails = [];
        }

        this.modalService.open(this.campaignDetailsModal, {
          size: 'lg',
          centered: true,
          scrollable: true,
        });
      },
    });
  }

  getKeyValuePairs(obj: any): { key: string; value: any }[] {
    if (!obj || typeof obj !== 'object') return [];

    return Object.entries(obj)
      .filter(([_, value]) => this.hasValue(value))
      .map(([key, value]) => ({ key, value }));
  }

  hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some((v) => this.hasValue(v));
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  openInfoPopup(campaign: any, content: TemplateRef<any>): void {
    this.isLoadingInfo = true;
    this.infoData = null;

    const body = {
      Name: 'GetScoreRationale',
      Params: { MSSCId: campaign.marketSurveyShoppingCenterId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.infoData = res.json[0].scoreRationale || null;
        this.score = res.json[0].score || null;
        this.conclusion = res.json[0].conclusion || null;

        this.isLoadingInfo = false;
        this.modalService.open(content, {
          size: 'xl',
          backdrop: true,
          centered: true,
        });
      },
    });
  }
}
