import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  ElementRef,
  Renderer2,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from '../../shared/services/places.service';
import { General } from '../../shared/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from '../../shared/services/maps.service';
import { BuyboxCategory } from '../../shared/models/buyboxCategory';
import { Center, Reaction } from '../../shared/models/shoppingCenters';
import { BbPlace } from '../../shared/models/buyboxPlaces';
import { DomSanitizer } from '@angular/platform-browser';
import { Polygon } from '../../shared/models/polygons';
import { ShareOrg } from '../../shared/models/shareOrg';
import { StateService } from '../../shared/services/state.service';
import { permission } from '../../shared/models/permission';
import { LandingPlace } from 'src/app/shared/models/landingPlace';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  shoppingCenter: any;
  General!: General;
  BuyBoxId!: any;
  OrgId!: any;
  ContactId!: any;
  dropdowmOptions: any = [
    {
      text: 'Map',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
    {
      text: 'Side',
      icon: '../../../assets/Images/Icons/element-3.png',
      status: 2,
    },
    {
      text: 'Cards',
      icon: '../../../assets/Images/Icons/grid-1.png',
      status: 3,
    },
    {
      text: 'Table',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    {
      text: 'Social',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
  ];
  currentView: any;
  map: any;
  cardsSideList: any[] = [];
  selectedOption!: number;
  savedMapView: any;
  mapViewOnePlacex: boolean = false;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  navbarOpen: any;
  OrganizationContacts: any[] = [];
  newContact: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  buyboxPlaces: BbPlace[] = [];
  Polygons: Polygon[] = [];
  ShareOrg: ShareOrg[] = [];
  shareLink: any;
  BuyBoxName: string = '';
  Permission: permission[] = [];
  placesRepresentative: boolean | undefined;
  @ViewChild('contactsModal', { static: true }) contactsModalTemplate: any;
  StreetViewOnePlace!: boolean;
  sanitizedUrl!: any;
  placeImage: string[] = [];
  CustomPlace!: LandingPlace;
  ShoppingCenter!: any;
  likedShoppings: { [key: number]: boolean } = {};
  isLikeInProgress = false;
  selectedRating: string | null = null;
  clickTimeout: any;
  showDetails: boolean[] = [];
  selectedCenterId: number | null = null;
  replyingTo: { [key: number]: number | null } = {};
  newComments: { [key: number]: string } = {};
  newReplies: { [key: number]: string } = {};
  showComments: { [key: number]: boolean } = {};
  globalClickListener!: (() => void)[];
  @ViewChild('commentsContainer') commentsContainer: ElementRef | undefined;
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  currentIndex = -1;
  Guid!: string;
  GuidLink!: string;
  isMobileView: boolean;
  @ViewChild('ShareWithContact', { static: true }) ShareWithContact: any;
  @ViewChild('loginRegisterModal', { static: true }) loginRegisterModal: any;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {
    this.savedMapView = localStorage.getItem('mapView');
    this.isMobileView = window.innerWidth <= 768;
    this.markerService.clearMarkers();
  }

  ngOnInit(): void {
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      localStorage.setItem('contactId', this.ContactId);
    });
    this.BuyBoxPlacesCategories(this.BuyBoxId);
    this.GetOrganizationById(this.OrgId);
    this.GetCustomSections(this.BuyBoxId);
    // this.currentView = localStorage.getItem('currentView') || '2';
    this.currentView = this.isMobileView ? '5' : '2';
    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === parseInt(this.currentView)
    );
    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
  }

  toggleNavbar() {
    this.navbarOpen = !this.navbarOpen;
  }

  openContactsModal(content: any): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationContacts',
      Params: {
        organizationId: this.OrgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.OrganizationContacts = data.json;
        } else {
          this.OrganizationContacts = [];
        }
        this.spinner.hide();
        this.modalService.open(content, {
          size: 'lg',
          centered: true,
        });
      },
    });
  }

  addContact(form: NgForm): void {
    this.spinner.show();
    const body: any = {
      Name: 'AddContactToOrganization',
      Params: {
        FirstName: this.newContact.firstName,
        LastName: this.newContact.lastName,
        OrganizationId: this.OrgId,
        email: this.newContact.email,
        password: this.newContact.password,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        this.newContact = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        };
        form.resetForm();
        this.modalService.dismissAll();
        this.openContactsModal(this.contactsModalTemplate);
      },
    });
  }

  GetCustomSections(buyboxId: number): void {
    if (this.stateService.getPermission().length > 0) {
      this.Permission = this.stateService.getPermission();
      return;
    }
    const body: any = {
      Name: 'GetCustomSections',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Permission = data.json;
        this.placesRepresentative = this.Permission?.find(
          (item: permission) => item.sectionName === 'PlacesRepresentative'
        )?.visible;
        this.stateService.setPermission(data.json);
        if (this.stateService.getPlacesRepresentative()) {
          this.placesRepresentative =
            this.stateService.getPlacesRepresentative();
          return;
        }
        this.stateService.setPlacesRepresentative(this.placesRepresentative);
        this.markerService.setPlacesRepresentative(this.placesRepresentative);
      },
    });
  }

  GetOrganizationById(orgId: number): void {
    if (this.stateService.getShareOrg().length > 0) {
      this.ShareOrg = this.stateService.getShareOrg();
      return;
    }
    const body: any = {
      Name: 'GetOrganizationById',
      Params: {
        organizationid: orgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ShareOrg = data.json;
        this.stateService.setShareOrg(data.json);
      },
    });
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters(buyboxId);
      return;
    }
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters(this.BuyBoxId);
      },
    });
  }

  GetPolygons(): void {
    const body: any = {
      Name: 'PolygonStats',
      Params: {
        buyboxid: this.BuyBoxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
        this.markerService.drawMultiplePolygons(this.map, this.Polygons);
      },
    });
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.getBuyBoxPlaces(this.BuyBoxId);
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.shoppingCenters = this.shoppingCenters?.sort((a, b) =>
          a.CenterCity.localeCompare(b.CenterCity)
        );
        this.shoppingCenters = this.shoppingCenters?.filter(
          (element: any) => element.Deleted == false
        );

        this.stateService.setShoppingCenters(this.shoppingCenters);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
      },
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.getAllMarker();
      return;
    }
    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      },
    });
  }

  getLogo(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find(
        (branch) => branch.Id === id
      );
      if (foundBranch) {
        return place.id;
      }
    }
    return undefined;
  }

  getLogoTitle(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find(
        (branch) => branch.Id === id
      );
      if (foundBranch) {
        return place.Name;
      }
    }
    return undefined;
  }

  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');
      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: lat,
            lng: lng,
          },
          zoom: zoom,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      } else {
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: this.shoppingCenters[0].Latitude,
            lng: this.shoppingCenters[0].Longitude,
          },
          zoom: 8,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      }

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      this.GetPolygons();
      this.createCustomMarkers(this.buyboxCategories);
    } finally {
      this.spinner.hide();
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
      // this.markerService.fetchAndDrawPolygon(th)
    });

    // let centerIds: any[] = [];
    // this.shoppingCenters.forEach((center) => {
    //   // centerIds.push(center.Id);
    //   if (center.Latitude && center.Longitude) {
    //     // this.markerService.fetchAndDrawPolygon(this.map, center.CenterCity, center.CenterState , center.Neighbourhood);
    //     if (this.shoppingCenters.indexOf(center) < 1) {
    //       this.markerService.fetchAndDrawPolygon(
    //         this.map,
    //         center.CenterCity,
    //         center.CenterState,
    //         center.Latitude,
    //         center.Longitude
    //       );
    //     }
    //   }
    // });

    // const centerIdsString = centerIds.join(',');
  }

  getPolygons() {
    const body: any = {
      Name: 'GetBuyBoxSCsIntersectPolys',
      Params: {
        BuyBoxId: this.BuyBoxId,
        PolygonSourceId: 0,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json;
      this.markerService.drawMultiplePolygons(this.map, this.Polygons);
    });
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  onCheckboxChange(category: BuyboxCategory): void {
    this.markerService.toggleMarkers(this.map, category);
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
  }

  private saveMapView(map: any): void {
    const center = map.getCenter();
    const zoom = map.getZoom();
    localStorage.setItem(
      'mapView',
      JSON.stringify({
        lat: center.lat(),
        lng: center.lng(),
        zoom: zoom,
      })
    );
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );
    const allProperties = [...(this.shoppingCenters || [])];
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = parseFloat(property.Latitude);
    const lng = parseFloat(property.Longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }
    return bounds?.contains({ lat, lng });
  }

  onMouseEnter(place: any): void {
    const { Latitude, Longitude } = place;
    const mapElement = document.getElementById('map') as HTMLElement;
    if (!mapElement) return;
    if (this.map) {
      this.map.setCenter({ lat: +Latitude, lng: +Longitude });
      this.map.setZoom(17);
    }
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    localStorage.setItem('currentView', this.currentView);
  }

  goToPlace(place: any) {
    if (place.CenterAddress) {
      this.router.navigate([
        '/landing',
        place.ShoppingCenter?.Places ? place.ShoppingCenter.Places[0].Id : 0,
        place.Id,
        this.BuyBoxId,
        this.OrgId,
      ]);
    } else {
      this.router.navigate([
        '/landing',
        place.Id,
        0,
        this.BuyBoxId,
        this.OrgId,
      ]);
    }
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;

    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    } else {
      setTimeout(() => {
        this.viewOnStreet();
      }, 100);
    }
  }

  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  trackByIndex(index: number, item: any): number {
    return index; // Return the index to track by the position
  }

  viewOnStreet() {
    this.StreetViewOnePlace = true;
    let lat = +this.General.modalObject.StreetLatitude;
    let lng = +this.General.modalObject.StreetLongitude;
    let heading = this.General.modalObject.Heading || 165;
    let pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
      }
    });
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 }, // Dynamic heading and pitch
          zoom: 1,
        }
      );
      this.addMarkerToStreetView(panorama, lat, lng);
    } else {
    }
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number) {
    const svgPath =
      'M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z';

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: panorama,
      icon: {
        path: svgPath,
        scale: 4,
        fillColor: 'black',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 1,
      },
    });
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  openLink(content: any, contact?: any) {
    // Use the contact's token if provided, otherwise fallback
    if (contact && contact.token) {
      this.shareLink = `https://cp.cherrypick.com/?t=${contact.token}`;
    } else if (this.ShareOrg && this.ShareOrg[0]) {
      this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}`;
    } else {
      this.shareLink = '';
    }

    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {})
      .catch((err) => {});
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;
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

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };
    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice; // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `;
    };
    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    if (buildingSizes.length === 0) {
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const resultPrice =
          leasePrice && leasePrice !== 'On Request'
            ? appendInfoIcon(
                `$${formatNumberWithCommas(
                  Math.floor((parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        return `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
      return null;
    }
    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);
    const minPrice =
      places.find((place: any) => place.BuildingSizeSf === minSize)
        ?.ForLeasePrice || 'On Request';
    const maxPrice =
      places.find((place: any) => place.BuildingSizeSf === maxSize)
        ?.ForLeasePrice || 'On Request';
    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(
            maxSize
          )} sq ft.`;

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(maxPrice) * maxSize) / 12)
            )}/month`,
            maxPrice
          );
    let leasePriceRange;
    if (
      formattedMinPrice === 'On Request' &&
      formattedMaxPrice === 'On Request'
    ) {
      leasePriceRange = 'On Request';
    } else if (formattedMinPrice === 'On Request') {
      leasePriceRange = formattedMaxPrice;
    } else if (formattedMaxPrice === 'On Request') {
      leasePriceRange = formattedMinPrice;
    } else if (formattedMinPrice === formattedMaxPrice) {
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

  getNeareastCategoryName(categoryId: number) {
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }

  toggleComments(shopping: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isUserLoggedIn()) {
      this.openLoginModal();
      return;
    }
    this.showComments[shopping.Id] = !this.showComments[shopping.Id];
  }

  addComment(shopping: Center, marketSurveyId: number): void {
    if (!this.newComments[marketSurveyId]?.trim()) {
      return;
    }

    const commentText = this.newComments[marketSurveyId];
    this.newComments[marketSurveyId] = '';

    const body = {
      Name: 'CreateComment',
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        Comment: commentText,
        ParentCommentId: 0,
        identity: this.ContactId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (!shopping.ShoppingCenter.Comments) {
          shopping.ShoppingCenter.Comments = [];
        }

        shopping.ShoppingCenter.Comments.push({
          Comment: commentText,
          CommentDate: new Date().toISOString(),
        });

        shopping.ShoppingCenter.Comments = this.sortCommentsByDate(
          shopping.ShoppingCenter.Comments
        );
      },
    });
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
      return;
    }

    const replyText = this.newReplies[commentId];
    this.newReplies[commentId] = '';

    const body = {
      Name: 'CreateComment',
      Params: {
        MarketSurveyId: marketSurveyId,
        Comment: replyText,
        ParentCommentId: commentId,
        identity: this.ContactId
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.replyingTo[marketSurveyId] = null;

        const shoppingCenter = this.shoppingCenters.find(
          (sc) => sc.MarketSurveyId === marketSurveyId
        );
        if (shoppingCenter && shoppingCenter.ShoppingCenter.Comments) {
          shoppingCenter.ShoppingCenter.Comments.push({
            Comment: replyText,
            CommentDate: new Date().toISOString(),
            ParentCommentId: commentId,
          });

          shoppingCenter.ShoppingCenter.Comments = this.sortCommentsByDate(
            shoppingCenter.ShoppingCenter.Comments
          );
        }
      },
    });
  }

  openAddContactModal(content: any): void {
    this.newContact = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    };
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-add-contact',
      size: 'lg',
      centered: true,
      scrollable: true,
    });
  }

  toggleReply(shopping: any, commentId: number): void {
    if (!this.replyingTo[shopping.MarketSurveyId]) {
      this.replyingTo[shopping.MarketSurveyId] = null;
    }

    this.replyingTo[shopping.MarketSurveyId] =
      this.replyingTo[shopping.MarketSurveyId] === commentId ? null : commentId;
  }

  sortCommentsByDate(comments: any[]): any[] {
    return comments?.sort(
      (a, b) =>
        new Date(b.CommentDate).getTime() - new Date(a.CommentDate).getTime()
    );
  }

  @ViewChild('galleryModal', { static: true }) galleryModal: any;
  openGallery(shpping: number) {
    this.GetPlaceDetails(0, shpping);
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        buyboxid: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CustomPlace = data.json?.[0] || null;
        this.ShoppingCenter = this.CustomPlace;

        if (this.ShoppingCenter && this.ShoppingCenter.Images) {
          this.placeImage = this.ShoppingCenter.Images?.split(',').map(
            (link: any) => link.trim()
          );
        }
      },
    });
  }

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  scrollUp() {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: -cardHeight,
      behavior: 'smooth',
    });
  }

  scrollDown() {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: cardHeight,
      behavior: 'smooth',
    });
  }

  ngAfterViewInit(): void {
    const events = ['click', 'wheel', 'touchstart'];
    this.globalClickListener = events.map((eventType) =>
      this.renderer.listen('document', eventType, (event: Event) => {
        const target = event.target as HTMLElement;
        const commentsContainer = this.commentsContainer?.nativeElement;
        const isInsideComments = commentsContainer?.contains(target);
        const isInputFocused =
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isClickOnLikeOrPhoto =
          target.classList.contains('like-button') ||
          target.classList.contains('photo');
        if (isInsideComments || isInputFocused || isClickOnLikeOrPhoto) {
          return;
        }
        this.hideAllComments();
      })
    );
  }

  trimComment(value: string, marketSurveyId: number): void {
    if (value) {
      this.newComments[marketSurveyId] = value.trimLeft();
    } else {
      this.newComments[marketSurveyId] = '';
    }
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem('contactId');
    if (!contactIdStr) {
      return;
    }
    const contactId = parseInt(contactIdStr, 10);

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some(
        (reaction: Reaction) => reaction.ContactId === contactId
      )
    ) {
      return;
    }

    if (this.isLikeInProgress) {
      return;
    }

    this.isLikeInProgress = true;
    const isLiked = this.likedShoppings[shopping.MarketSurveyId];

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    if (!isLiked) {
      shopping.ShoppingCenter.Reactions.length++;
      this.likedShoppings[shopping.MarketSurveyId] = true;
    }
    // else {
    //   shopping.ShoppingCenter.Reactions.length--;
    //   delete this.likedShoppings[shopping.MarketSurveyId];
    // }

    this.cdr.detectChanges();

    const body = {
      Name: 'CreatePropertyReaction',
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        ReactionId: reactionId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {},

      complete: () => {
        this.isLikeInProgress = false;
        this.cdr.detectChanges();
      },
    });
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1;
  }

  open(content: any, currentShopping: any, nextShopping: any) {
    this.modalService.open(content, {
      windowClass: 'custom-modal',
    });
    this.General.modalObject = currentShopping;
    this.General.nextModalObject = nextShopping;
  }

  rate(rating: 'dislike' | 'neutral' | 'like') {
    this.selectedRating = rating;
  }

  handleClick(shopping: any, likeTpl: TemplateRef<any>, index: number): void {
    if (!this.isUserLoggedIn()) {
      this.openLoginModal();
      return;
    }
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.addLike(shopping, 1);
    } else {
      this.clickTimeout = setTimeout(() => {
        const nextShopping = this.getNextShopping(index);
        this.open(likeTpl, shopping, nextShopping);
        this.clickTimeout = null;
      }, 250);
    }
  }
  getNextShopping(currentIndex: number): any {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      const nextIndex = (currentIndex + 1) % this.shoppingCenters.length;
      return this.shoppingCenters[nextIndex];
    }
    return null;
  }

  toggleDetails(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index];
    }
  }

  selectCenter(centerId: number): void {
    this.selectedCenterId = centerId;

    const selectedIndex = this.shoppingCenters.findIndex(
      (center) => center.Id === centerId
    );

    if (selectedIndex !== -1) {
      this.General.modalObject = this.shoppingCenters[selectedIndex];

      this.currentIndex = (this.currentIndex + 1) % this.shoppingCenters.length;

      let nextIndex = (this.currentIndex + 1) % this.shoppingCenters.length;
      while (nextIndex === selectedIndex) {
        nextIndex = (nextIndex + 1) % this.shoppingCenters.length;
      }
      this.General.nextModalObject = this.shoppingCenters[nextIndex];
    }
  }

  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false;
    }
  }

  toggleShortcutsCard(id: number | null, close?: string): void {
    if (close === 'close') {
      this.selectedIdCard = null;
    } else {
      this.selectedIdCard = this.selectedIdCard === id ? null : id;
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedId = null;
      this.selectedIdCard = null;
      return;
    }
  }
  OpenShareWithContactModal(content: any): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxGUID',
      Params: {
        BuyBoxId: +this.BuyBoxId,
        OrganizationId: +this.OrgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Guid = data.json[0].buyBoxLink;
        if (this.Guid) {
          this.GuidLink = `https://cp.cherrypick.com/?t=${this.Guid}`;
        } else {
          this.GuidLink = '';
        }
        this.spinner.hide();
      },
    });
    this.modalService.open(this.ShareWithContact, { size: 'lg' });
  }

  copyGUID(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        this.showToast('Tenant Link Copied to Clipboard!');
        this.modalService.dismissAll();
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
openLoginModal(): void {
  this.modalService.open(this.loginRegisterModal, {
    ariaLabelledBy: 'modal-login-register',
    centered: true,
    scrollable: true
  });
}
registerUser(form: NgForm): void {
  if (form.invalid) {
    return;
  }
  this.spinner.show();
  const body = {
    Name: 'AddContactToOrganization',
    Params: {
      FirstName: this.newContact.firstName,
      LastName: this.newContact.lastName,
      email: this.newContact.email,
      password: 1234,
      OrganizationId: this.OrgId,
      buyboxId : this.BuyBoxId,
    }
  };
  this.PlacesService.GenericAPI(body).subscribe({
    next: (response: any) => {
      if (response && response.json && response.json.length > 0 && response.json[0].id) {
        localStorage.setItem('contactId', response.json[0].id.toString());
        this.modalService.dismissAll();
        this.showToast('Registration successful!');
      } else if (response.error) {
        alert('Registration failed: ' + response.error);
      } else {
        alert('Registration failed: Unable to process registration');
      }
    },
    error: (err) => {
      console.error('Registration error:', err);
      alert('Registration failed: ' + (err.message || 'Unknown error'));
      this.spinner.hide();
      this.modalService.dismissAll();
    },
    complete: () => {
      this.spinner.hide();
      this.modalService.dismissAll();
    }
  });
}
navigateToLogin(): void {
  this.modalService.dismissAll();
  this.router.navigate(['/login']);
}
isUserLoggedIn(): boolean {
  const contactId = localStorage.getItem('contactId');
  const x =contactId !== "undefined";
  return x;
}
}
