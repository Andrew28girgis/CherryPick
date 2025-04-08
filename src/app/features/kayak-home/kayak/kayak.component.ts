import {
  Component,
  OnInit,
  TemplateRef,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
   
import { StatesAndCities } from '../../../shared/models/kayak';
import { General } from '../../../shared/models/domain';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import {
  FilterValues,
  KayakFilters,
  ManagementOrganization,
  Tenant,
  SecondaryType,
  Neighbourhood,
  TenantsCategories,
} from '../../../shared/models/filters';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Center } from '../../../shared/models/shoppingCenters';
import { finalize, Observable, of, switchMap, tap } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import { MapsService } from 'src/app/core/services/maps.service';
import { StateService } from 'src/app/core/services/state.service';

declare const google: any;

@Component({
  selector: 'app-kayak',
  templateUrl: './kayak.component.html',
  styleUrls: ['./kayak.component.css'],
})
export class KayakComponent implements OnInit {
  General!: General;
  placeImage: string[] = [];
  Ids!: number[];
  KayakResult!: any;
  ShoppingCenters!: any;
  KayakCitiesandStates: StatesAndCities[] = [];
  selectedState: any;
  selectedCity: any;
  uniqueStates!: any[];
  uniqueCities!: any[];
  Filters!: KayakFilters;
  filterValues!: FilterValues;
  tags: any[] = [];
  visibleTags: any[] = [];
  selectedTags: any[] = [];
  searchTerm: string = '';
  filteredKayakResult: any[] = [];
  sortedTenants: Tenant[] = [];
  sortedOrgs: ManagementOrganization[] = [];
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  mapViewOnePlacex: boolean = false;
  ShoppingCenterAvailability: any = null;
  ShoppingCenterTenants: any = null;
  isDropdownOpen: boolean = false;
  isDropdownOpenIndex: number | null = null;
  selectedbuyBox!: string;
  SelectedShoppingCenterIDs: number[] = [];
  SelectedPlacesIDs: number[] = [];
  loading: boolean = true;
  isBulkMode: boolean = false;
  selectedPlaces: any[] = [];
  expandedPlacesIndex: number | null = null;
  secondaryTypes: any[] = [];
  neighbourhoods: any[] = [];
  tenantCategories: any[] = [];
  selectedShoppingCenterId: number = 0;
  boundShoppingCenterIds: number[] = [];
  deleteshoppingcenterID!: number;
  shoppingCenters: Center[] = [];
  minBuildingSize: number = 0;
  maxBuildingSize: number = 100000;
  selectedMin: number = 0;
  selectedMax: number = 100000;
  selectedCenter: string = '';

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
       
    private markerService: MapsService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private stateService: StateService,
    private http: HttpClient
  ) {
    this.markerService.clearMarkers();
  }

  ngOnInit(): void {
    this.General = new General();
    this.filterValues = {
      statecode: '',
      city: '',
      neighbourhood: '',
      availabilty: false,
      sqft: 0,
      secondarytype: '',
      tenants: '',
      tags: '',
      managementOrganizationIds: '',
      minsize: 0,
      maxsize: 0,
      tenantCategory: '',
    };

    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
    });
    this.GetStates();
    this.getBindedShoppingCenters();
  }

  GetStates(): void {
      
    const body: any = { Name: 'GetStates', Params: {} };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakCitiesandStates = data.json;
        this.uniqueStates = [
          ...new Set(
            this.KayakCitiesandStates.map((item: any) => item.stateCode.trim())
          ),
        ];
             
      },
    });
  }

  getBindedShoppingCenters(): void {
      
    const body: any = {
      Name: 'GetMarketSurveyShoppingCentersByBBoxId',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.SelectedShoppingCenterIDs = res.json.map(
          (item: any) => item.shoppingCenterId
        );
             
      },
    });
  }
  getResult(): Observable<any> {
      
    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };

    return this.PlacesService.GenericAPI(body).pipe(
      tap((data: any) => {
        this.KayakResult = data.json[0];
        this.Ids = this.KayakResult.Ids || [];
        this.ShoppingCenters = this.KayakResult.Result;
        this.getBindedShoppingCentersNumber();
      }),
           
    );
  }
  GetFilters(): void {
    if (!this.Ids) {
      this.resetFilters();
      return;
    }
      
    const body: any = {
      Name: 'GetFilters',
      Params: {
        ids: this.Ids,
        buyboxid: this.selectedbuyBox,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json && data.json.length > 0) {
          this.Filters = data.json[0];
          // Update all filters dynamically
          this.updateSortedTenants();
          this.updateSortedOrgs();
          this.updateSecondaryTypes();
          this.updateNeighbourhoods();
          this.updateTenantCategories();
          this.updateMinMaxBuildingSize();
        } else {
          this.resetFilters();
        }
             
      }
    });
  }

  getBindedShoppingCentersNumber() {
    const count = this.KayakResult?.Result?.filter((result: any) =>
      this.SelectedShoppingCenterIDs?.includes(result.Id)
    ).length;
    return count;
  }
  getTotalShopping() {
    this.ShoppingCenters = this.KayakResult.Result;
  }
  getBindedShopping() {
    this.ShoppingCenters = [];
    this.KayakResult.Result.forEach((result: any) =>
      this.SelectedShoppingCenterIDs.includes(result.Id)
        ? this.ShoppingCenters.push(result)
        : null
    );
  }
  getUnBindedShopping() {
    this.ShoppingCenters = [];
    this.KayakResult.Result.forEach((result: any) =>
      this.SelectedShoppingCenterIDs.includes(result.Id)
        ? null
        : this.ShoppingCenters.push(result)
    );
  }
  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    }
  }
  toggleExpandedPlaces(index: number): void {
    this.expandedPlacesIndex =
      this.expandedPlacesIndex === index ? null : index;
  }
  openModal(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }
  @ViewChild('placesModal', { static: true }) placesModal!: TemplateRef<any>;

  openPlacesModal(places: any[], shoppingCenterId: number): void {
    this.selectedPlaces = places;
    this.selectedShoppingCenterId = shoppingCenterId;
    this.modalService.open(this.placesModal, { size: 'lg', centered: true });
  }
  toggleBulkMode(): void {
    this.isBulkMode = !this.isBulkMode;
  }
  toggleShoppingCenterBind(
    shoppingCenterId: number,
    isChecked?: boolean
  ): void {
    this.deleteshoppingcenterID = shoppingCenterId;

    const isAlreadyBound =
      this.SelectedShoppingCenterIDs.includes(shoppingCenterId);

    if (isChecked !== undefined) {
      // If the checkbox explicitly sets the value, bind or unbind accordingly
      if (isChecked && !isAlreadyBound) {
        this.SelectedShoppingCenterIDs.push(shoppingCenterId);
        this.bindShoppingCenter();
      } else if (!isChecked && isAlreadyBound) {
        this.SelectedShoppingCenterIDs = this.SelectedShoppingCenterIDs.filter(
          (id) => id !== shoppingCenterId
        );
        this.UnBindShoppingCenter();
      }
    } else {
      if (isAlreadyBound) {
        this.SelectedShoppingCenterIDs = this.SelectedShoppingCenterIDs.filter(
          (id) => id !== shoppingCenterId
        );
        this.UnBindShoppingCenter();
      } else {

        this.SelectedShoppingCenterIDs.push(shoppingCenterId);
        this.bindShoppingCenter(shoppingCenterId);
      }
    }

  }

  bindShoppingCenter(id?: number): void {
    if (!this.SelectedShoppingCenterIDs.length) {
      return;
    }

      
    this.loading = true;


    const body = {
      Name: 'BindShoppingCenters',
      Params: {
        buyboxid: this.selectedbuyBox,
        state: this.filterValues.statecode || '',
        city: this.selectedCity || '',
        shoppingcenterId: id,
        placeIds: this.SelectedPlacesIDs.join(','),
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
             
        this.loading = false;
        this.getShoppingCenters();
      }
    });
  }
  UnBindShoppingCenter() {
      
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyboxId: +this.selectedbuyBox,
        ShoppingCenterId: this.deleteshoppingcenterID,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
             
        this.loading = false;
        this.getShoppingCenters();
      }
    });
  }

  onCardCheckboxChange(event: Event, result: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.toggleShoppingCenterBind(result.Id, isChecked);
  }

  togglePlaceBind(placeId: number, shoppingCenterId: number): void {
    const isAlreadyBound = this.SelectedPlacesIDs.includes(placeId);

    if (isAlreadyBound) {
      this.SelectedPlacesIDs = this.SelectedPlacesIDs.filter(
        (id) => id !== placeId
      );
    } else {
      this.SelectedPlacesIDs.push(placeId);
    }

    if (!this.SelectedShoppingCenterIDs.includes(shoppingCenterId)) {
      this.SelectedShoppingCenterIDs.push(shoppingCenterId);
    }

    //   'Updated Selected Shopping Centers:',
    //   this.SelectedShoppingCenterIDs
    // );
    this.bindShoppingCenter();
  }

  truncateText(text: string, limit: number = 25): string {
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  @ViewChild('tenantModal', { static: true }) tenantModal!: TemplateRef<any>;

  GetShoppingCenterTenants(shoppingCenterId: number): void {
      

    const body: any = {
      Name: 'GetShoppingCenterTenants',
      Params: {
        shoppingcenterid: shoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.ShoppingCenterTenants = data.json;
          this.modalService.open(this.tenantModal, {
            size: 'lg',
            centered: true,
          });
        } else {
          this.ShoppingCenterTenants = [];
        }
             
      }
    });
  }

  @ViewChild('galleryModal', { static: true }) galleryModal: any;

  openGallery(index: number): void {
    const result = this.KayakResult.Result[index];
    if (result?.Images) {
      this.placeImage = result.Images.split(',').map((link: string) =>
        link.trim()
      );
    } else {
      this.placeImage = [];
    }


    this.modalService.open(this.galleryModal, { size: 'lg', centered: true });
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      return;
    }
    // Load Google Maps API libraries
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;

    if (!mapDiv) {
      return;
    }

    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    });

    // Create a new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
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

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 },
          zoom: 1,
        }
      );
      this.addMarkerToStreetView(panorama, lat, lng);
    } else {
    }
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

  setIframeUrl(url: string): void {
    if (!url) {
      return;
    }

    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openFiltersModal(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.General.modalObject = modalObject || {};


    // Open modal first
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    // If a Street View URL exists, load it
    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    } else {
      this.sanitizedUrl = null; // Clear iframe
    }
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }
  updateSortedTenants(): void {
    if (!this.Filters!.Tenants || !Array.isArray(this.Filters!.Tenants)) {
      this.sortedTenants = [];
      return;
    }

    const sortedList = [...this.Filters.Tenants].sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );

    const uniqueTenants = Array.from(
      new Set(sortedList.map((tenant) => tenant.OrganizationId))
    )
      .map((id) => sortedList.find((tenant) => tenant.OrganizationId === id))
      .filter((tenant): tenant is Tenant => tenant !== undefined);

    this.sortedTenants = uniqueTenants;
  }

  updateSortedOrgs(): void {
    if (
      !this.Filters!.ManagementOrganization ||
      !Array.isArray(this.Filters!.ManagementOrganization)
    ) {
      this.sortedOrgs = [];
      return;
    }

    const sortedList = [...this.Filters.ManagementOrganization].sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );

    const uniqueOrgs = Array.from(
      new Set(sortedList.map((org) => org.OrganizationId))
    )
      .map((id) => sortedList.find((org) => org.OrganizationId === id))
      .filter((org): org is ManagementOrganization => org !== undefined);

    this.sortedOrgs = uniqueOrgs;
  }

  updateSecondaryTypes(): void {
    if (
      !this.Filters?.SecondaryType ||
      !Array.isArray(this.Filters.SecondaryType)
    ) {
      this.secondaryTypes = [];
      return;
    }

    this.secondaryTypes = [...this.Filters.SecondaryType].sort((a, b) =>
      (a.SecondaryType || '').localeCompare(b.SecondaryType || '')
    );

  }

  updateNeighbourhoods(): void {
    if (
      !this.Filters?.Neighbourhood ||
      !Array.isArray(this.Filters.Neighbourhood)
    ) {
      this.neighbourhoods = [];
      return;
    }

    this.neighbourhoods = [...this.Filters.Neighbourhood]
      .filter((n) => n?.Neighbourhood)
      .map((n) => ({
        Neighbourhood: String(n.Neighbourhood || '').trim(),
      }))
      .sort((a, b) => a.Neighbourhood.localeCompare(b.Neighbourhood));

  }

  updateTenantCategories(): void {
    if (
      !this.Filters?.TenantsCategories ||
      !Array.isArray(this.Filters.TenantsCategories)
    ) {
      this.tenantCategories = [];
      return;
    }

    const sortedList = [...this.Filters.TenantsCategories]
      .map((category) => ({
        TenantsCategoriesId: category.TenantsCategoriesId,
        Name: category.Name?.trim() || 'Unknown',
        ChildCategory: category.ChildCategory || [],
        Selected: category.Selected || false,
      }))
      .sort((a, b) => a.Name.localeCompare(b.Name));

    this.tenantCategories = Array.from(new Set(sortedList));

  }
  updateMinMaxBuildingSize(): void {
    if (
      !this.Filters?.MinMaxBuildingSize ||
      !Array.isArray(this.Filters.MinMaxBuildingSize) ||
      this.Filters.MinMaxBuildingSize.length === 0
    ) {
      return;
    }

    const minMax = this.Filters.MinMaxBuildingSize[0];

    // Ensure that both MinSize and MaxSize are defined
    if (minMax.MinSize != null && minMax.MaxSize != null) {
      this.minBuildingSize = minMax.MinSize;
      this.maxBuildingSize = minMax.MaxSize;

      // Set the slider values initially
      this.selectedMin = this.minBuildingSize;
      this.selectedMax = this.maxBuildingSize;
    } else {
    }
  }

  updateSliderValues(): void {
    this.filterValues.minsize = this.selectedMin;
    this.filterValues.maxsize = this.selectedMax;
  }
  filterCards(): void {
    if (!this.KayakResult?.Result) {
      this.filteredKayakResult = []; // Ensure filtered result is empty if no data.
      return;
    }
    const search = this.searchTerm.toLowerCase();
    this.filteredKayakResult = this.KayakResult.Result.filter(
      (result: any) =>
        result.CenterName.toLowerCase().includes(search) ||
        result.CenterAddress.toLowerCase().includes(search) ||
        result.CenterCity.toLowerCase().includes(search) ||
        result.CenterState.toLowerCase().includes(search)
    );
  }
  getShoppingCenters(): void {
      
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: this.selectedbuyBox,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        // this.getStandAlonePlaces(this.selectedbuyBox);
        // this.getBuyBoxPlaces(this.BuyBoxId);
      }
    });
  }
  resetFilters(): void {
    this.sortedTenants = [];
    this.sortedOrgs = [];
    this.secondaryTypes = [];
    this.neighbourhoods = [];
    this.tenantCategories = [];
  }
  handleStateChange(selectedValue: string): void {
    // Update state and reset city
    this.filterValues.statecode = selectedValue;
    this.filterValues.city = '';
    this.filterValues.tenants = '';
    this.filterValues.managementOrganizationIds = '';
    this.filterValues.secondarytype = '';
    this.filterValues.neighbourhood = '';
    this.filterValues.tenantCategory = '';
    this.filterValues.minsize = 0;
    this.filterValues.maxsize = 0;
    this.selectedCity = null;
    this.updateCitiesForSelectedState();
    this.getResult()
      .pipe(
        switchMap(() => {
          if (this.Ids && this.Ids.length) {
            const filtersBody: any = {
              Name: 'GetFilters',
              Params: {
                ids: this.Ids,
                buyboxid: this.selectedbuyBox,
              },
            };
            return this.PlacesService.GenericAPI(filtersBody);
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data && data.json && data.json.length > 0) {
            this.Filters = data.json[0];
            this.updateSortedTenants();
            this.updateSortedOrgs();
            this.updateSecondaryTypes();
            this.updateNeighbourhoods();
            this.updateTenantCategories();
            this.updateMinMaxBuildingSize();
          } else {
            this.resetFilters();
          }
        }
      });
  }

  onCityChange(selectedValue: string): void {
    // Set the selected city (do not reset it afterwards)
    this.filterValues.city = selectedValue;

    // Reset other filters as needed
    this.filterValues.tenants = '';
    this.filterValues.managementOrganizationIds = '';
    this.filterValues.secondarytype = '';
    this.filterValues.neighbourhood = '';
    this.filterValues.tenantCategory = '';
    this.filterValues.minsize = 0;
    this.filterValues.maxsize = 0;

    // Chain getResult() with the GetFilters() API call
    this.getResult()
      .pipe(
        switchMap(() => {
          // Only call GetFilters if there are valid IDs from getResult()
          if (this.Ids && this.Ids.length) {
            const filtersBody: any = {
              Name: 'GetFilters',
              Params: {
                ids: this.Ids,
                buyboxid: this.selectedbuyBox,
              },
            };
            return this.PlacesService.GenericAPI(filtersBody);
          } else {
            // If there are no IDs, return an observable of null
            return of(null);
          }
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data && data.json && data.json.length > 0) {
            this.Filters = data.json[0];
            this.updateSortedTenants();
            this.updateSortedOrgs();
            this.updateSecondaryTypes();
            this.updateNeighbourhoods();
            this.updateTenantCategories();
            this.updateMinMaxBuildingSize();
          } else {
            this.resetFilters();
          }
        }
      });
  }

  updateCitiesForSelectedState(): void {
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode === this.filterValues.statecode
    );
  }
  toggleTenantSelection(tenant: Tenant): void {
    const currentTenants = this.filterValues.tenants || '';
    let tenantIds = currentTenants.split(',').filter((id: any) => id.trim());
    const tenantIdAsString = String(tenant.OrganizationId);
    if (!tenantIds.includes(tenantIdAsString)) {
      tenantIds.push(tenantIdAsString);
    } else {
      tenantIds = tenantIds.filter((id: any) => id !== tenantIdAsString);
    }

    this.filterValues.tenants = tenantIds.join(',');
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
  toggleOrgSelection(org: ManagementOrganization): void {
    const currentOrgs = this.filterValues.managementOrganizationIds || '';
    let orgIds = currentOrgs.split(',').filter((id: any) => id.trim());

    const orgIdAsString = String(org.OrganizationId);
    if (!orgIds.includes(orgIdAsString)) {
      orgIds.push(orgIdAsString);
    } else {
      orgIds = orgIds.filter((id: any) => id !== orgIdAsString);
    }
    this.filterValues.managementOrganizationIds = orgIds.join(',');
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
  toggleSecondaryTypeSelection(secondary: SecondaryType): void {
    const currentSecondaryTypes = this.filterValues.secondarytype || '';
    let secondaryTypeList = currentSecondaryTypes
      .split(',')
      .filter((type: any) => type.trim());

    if (!secondaryTypeList.includes(secondary.SecondaryType)) {
      secondaryTypeList.push(secondary.SecondaryType);
    } else {
      secondaryTypeList = secondaryTypeList.filter(
        (type: any) => type !== secondary.SecondaryType
      );
    }

    this.filterValues.secondarytype = secondaryTypeList.join(',');
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
  toggleNeighbourhoodSelection(neighbourhood: Neighbourhood): void {
    if (!neighbourhood.Neighbourhood) {
      return;
    }

    const currentNeighbourhoods = this.filterValues.neighbourhood || '';
    let neighbourhoodList = currentNeighbourhoods
      .split(',')
      .filter((name: string) => name.trim());

    if (!neighbourhoodList.includes(neighbourhood.Neighbourhood)) {
      neighbourhoodList.push(neighbourhood.Neighbourhood);
    } else {
      neighbourhoodList = neighbourhoodList.filter(
        (name: string) => name !== neighbourhood.Neighbourhood
      );
    }

    this.filterValues.neighbourhood = neighbourhoodList.join(',');
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
  toggleTenantCategorySelection(category: TenantsCategories): void {
    const currentCategories = this.filterValues.tenantCategory || '';
    let categoryList = currentCategories
      .split(',')
      .filter((name: any) => name.trim());

    if (!categoryList.includes(category.Name)) {
      categoryList.push(category.Name);
    } else {
      categoryList = categoryList.filter((name: any) => name !== category.Name);
    }

    this.filterValues.tenantCategory = categoryList.join(',');
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
  selectShoppingCenter(type: string): void {
    this.selectedCenter = type;
    if (type === 'total') this.getTotalShopping();
    else if (type === 'binded') this.getBindedShopping();
    else if (type === 'unBinded') this.getUnBindedShopping();
  }
  applyFilter(): void {
    this.getResult().subscribe({
      next: (data) => {},
    });
  }
}
