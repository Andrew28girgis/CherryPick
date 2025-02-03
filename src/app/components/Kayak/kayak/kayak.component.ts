 import {
  Component,
  OnInit,
  TemplateRef,
  ChangeDetectorRef, 
  ViewChild,
  HostListener,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from '../../../../app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { KayakResult, StatesAndCities } from '../../../../models/kayak';
import { 
  General, 
} from './../../../../../src/models/domain';
import { DomSanitizer } from '@angular/platform-browser';
import { MapsService } from './../../../../../src/app/services/maps.service';
import { HttpClient } from '@angular/common/http';

import {
  FilterValues,
  KayakFilters,
  ManagementOrganization,
  Tenant,
  SecondaryType,
  Neighbourhood,
  TenantsCategories,
} from '../../../../models/filters';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateService } from '../../../../../src/app/services/state.service';
import { Center } from '../../../../models/shoppingCenters';

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
  deleteshoppingcenterID!:number;
  shoppingCenters: Center[] = []; 
  minBuildingSize: number = 0;
  maxBuildingSize: number = 100000; // Large default to avoid issues
  selectedMin: number = 0;
  selectedMax: number = 100000;
  


  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
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
    this.GetStatesAndCities();

 
    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
     });
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

  bindShoppingCenter(): void {
    if (!this.SelectedShoppingCenterIDs.length) {
      console.warn(' No shopping centers selected! Skipping API call.');
      return;
    }

    this.spinner.show();
    this.loading = true;

    // console.log(' Binding Shopping Centers and Places...');
    // console.log(' Shopping Center IDs:', this.SelectedShoppingCenterIDs);
    // console.log(' Place IDs:', this.SelectedPlacesIDs);

    const body = {
      Name: 'BindShoppingCenters',
      Params: {
        buyboxid: this.selectedbuyBox,
        state: this.filterValues.statecode || '',
        city: this.selectedCity || '',
        shoppingcenterIds: this.SelectedShoppingCenterIDs.join(','),
        placeIds: this.SelectedPlacesIDs.join(','),
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        // console.log(' API Response:', res?.json);
        this.spinner.hide();
        this.loading = false;
        this.getShoppingCenters();
      },
      error: (err) => {
        console.error(' Error in BindShoppingCenters:', err);
        this.spinner.hide();
        this.loading = false;
      },
    });
  }

  GetMarketSurveyShoppingCentersByBBoxId(): void {
    this.spinner.show(); 
    const body: any = {
      Name: 'GetMarketSurveyShoppingCentersByBBoxId',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          this.boundShoppingCenterIds = res.json.map(
            (item: any) => item.shoppingCenterId
          );
          this.SelectedShoppingCenterIDs = [...this.boundShoppingCenterIds]; 
        }
        this.spinner.hide();
      },
    
    });
  }

  toggleShoppingCenterBind(shoppingCenterId: number, isChecked?: boolean): void {
    this.deleteshoppingcenterID = shoppingCenterId;
    // console.log('deleteshoppingcenterID:', this.deleteshoppingcenterID);

    const isAlreadyBound = this.SelectedShoppingCenterIDs.includes(shoppingCenterId);

    if (isChecked !== undefined) {
        // If the checkbox explicitly sets the value, bind or unbind accordingly
        if (isChecked && !isAlreadyBound) {
            this.SelectedShoppingCenterIDs.push(shoppingCenterId);
            this.bindShoppingCenter();
        } else if (!isChecked && isAlreadyBound) {
            this.SelectedShoppingCenterIDs = this.SelectedShoppingCenterIDs.filter(id => id !== shoppingCenterId);
            this.UnBindShoppingCenter();
        }
    } else {
        // If `isChecked` is not provided, handle normal button toggle behavior
        if (isAlreadyBound) {
            this.SelectedShoppingCenterIDs = this.SelectedShoppingCenterIDs.filter(id => id !== shoppingCenterId);
            this.UnBindShoppingCenter();
        } else {
            this.SelectedShoppingCenterIDs.push(shoppingCenterId);
            this.bindShoppingCenter();
        }
    }

    // console.log('Updated Selected Shopping Center IDs:', this.SelectedShoppingCenterIDs);
}

UnBindShoppingCenter(){
  this.spinner.show();
  const body: any = {
    Name: 'DeleteShoppingCenterFromBuyBox',
    Params: {
      BuyboxId: +this.selectedbuyBox,
      ShoppingCenterId: this.deleteshoppingcenterID,
    },
  };
  this.PlacesService.GenericAPI(body).subscribe({
    next: (res) => {
      // console.log(' API Response:', res?.json);
      this.spinner.hide();
      this.loading = false;
      this.getShoppingCenters();
    },
    error: (err) => {
      console.error(' Error in BindShoppingCenters:', err);
      this.spinner.hide();
      this.loading = false;
    },
  });
}
  GetMarketSurveyPlacesByBBoxId(): void {
    this.spinner.show();

    // console.log('Fetching bound places for BuyBox ID:', this.selectedbuyBox);

    const body: any = {
      Name: 'GetMarketSurveyPlacesByBBoxId',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          this.SelectedPlacesIDs = res.json.map((item: any) => item.placeId);
          // console.log('Bound Place IDs:', this.SelectedPlacesIDs);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error in GetMarketSurveyPlacesByBBoxId:', err);
        this.spinner.hide();
      },
    });
  }    

  onCardCheckboxChange(event: Event, result: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    // console.log(`Checkbox changed for ${result.Id}, checked:`, isChecked);
    this.toggleShoppingCenterBind(result.Id, isChecked);
}


  togglePlaceBind(placeId: number, shoppingCenterId: number): void {
    const isAlreadyBound = this.SelectedPlacesIDs.includes(placeId);

    if (isAlreadyBound) {
      this.SelectedPlacesIDs = this.SelectedPlacesIDs.filter(
        (id) => id !== placeId
      );
      // console.log(`Unbound place with ID: ${placeId}`);
    } else {
      this.SelectedPlacesIDs.push(placeId);
      // console.log(`Bound place with ID: ${placeId}`);
    }

    if (!this.SelectedShoppingCenterIDs.includes(shoppingCenterId)) {
      this.SelectedShoppingCenterIDs.push(shoppingCenterId);
    }

    // console.log('Updated Selected Places:', this.SelectedPlacesIDs);
    // console.log(
    //   'Updated Selected Shopping Centers:',
    //   this.SelectedShoppingCenterIDs
    // );
    this.bindShoppingCenter();
  }

  GetShoppingCenterAvailability(shoppingCenterId: number): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetShoppingCenterAvailability',
      Params: {
        shoppingcenterid: shoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.ShoppingCenterAvailability = data.json;
          // console.log(
          //   'Shopping Center Availability:',
          //   this.ShoppingCenterAvailability
          // );
        }
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching Shopping Center Availability:', error);
        this.spinner.hide();
      },
    });
  }

  truncateText(text: string, limit: number = 25): string {
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  @ViewChild('tenantModal', { static: true }) tenantModal!: TemplateRef<any>;

  GetShoppingCenterTenants(shoppingCenterId: number): void {
    this.spinner.show();

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
          // console.log('Fetched Tenants:', this.ShoppingCenterTenants);
          this.modalService.open(this.tenantModal, {
            size: 'lg',
            centered: true,
          });
        } else {
          this.ShoppingCenterTenants = [];
        }
        this.spinner.hide();
      },
      error: (error: any) => {
        console.error('Error fetching Shopping Center Tenants:', error);
        this.spinner.hide();
      },
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

    // console.log('Images for Gallery:', this.placeImage);

    this.modalService.open(this.galleryModal, { size: 'lg', centered: true });
  }
  
  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
    // Load Google Maps API libraries
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;

    if (!mapDiv) {
      console.error('Element with ID "mappopup" not found.');
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
          pov: { heading: heading, pitch: 0 }, // Dynamic heading and pitch
          zoom: 1,
        }
      );
      this.addMarkerToStreetView(panorama, lat, lng);
    } else {
      console.error("Element with id 'street-view' not found in the DOM.");
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
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  setIframeUrl(url: string): void {
    if (!url) {
      console.error('🚨 Invalid StreetView URL:', url);
      return;
    }

    // console.log('🌍 Setting StreetView URL:', url);
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openFiltersModal(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.General.modalObject = modalObject || {};

    // console.log('✅ Opening Street View for:', this.General.modalObject);

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
      console.warn('🚨 No Street View URL found!');
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
      // console.error('Tenants list is empty or undefined.');
      this.sortedTenants = [];
      return;
    }

    // Sort tenants alphabetically by Name
    const sortedList = [...this.Filters.Tenants].sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );

    // Remove duplicate tenants based on OrganizationId
    const uniqueTenants = Array.from(
      new Set(sortedList.map((tenant) => tenant.OrganizationId))
    )
      .map((id) => sortedList.find((tenant) => tenant.OrganizationId === id))
      .filter((tenant): tenant is Tenant => tenant !== undefined);

    this.sortedTenants = uniqueTenants;
    // console.log('Sorted Tenants:', this.sortedTenants); 
  }

  updateSortedOrgs(): void {
    if (
      !this.Filters!.ManagementOrganization ||
      !Array.isArray(this.Filters!.ManagementOrganization)
    ) {
      // console.error('ManagementOrganization list is empty or undefined.');
      this.sortedOrgs = [];
      return;
    }

    // Sort organizations alphabetically by Name
    const sortedList = [...this.Filters.ManagementOrganization].sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );

    // Remove duplicate organizations based on OrganizationId
    const uniqueOrgs = Array.from(
      new Set(sortedList.map((org) => org.OrganizationId))
    )
      .map((id) => sortedList.find((org) => org.OrganizationId === id))
      .filter((org): org is ManagementOrganization => org !== undefined);

    this.sortedOrgs = uniqueOrgs;
    // console.log('Sorted Organizations:', this.sortedOrgs); 
  }

  updateSecondaryTypes(): void {
    if (!this.Filters?.SecondaryType || !Array.isArray(this.Filters.SecondaryType)) {
        // console.error('Secondary types are empty or undefined.');
        this.secondaryTypes = [];
        return;
    }

    // 🔹 Sort alphabetically
    this.secondaryTypes = [...this.Filters.SecondaryType].sort((a, b) =>
        (a.SecondaryType || '').localeCompare(b.SecondaryType || '')
    );

    // console.log('Sorted Secondary Types:', this.secondaryTypes);
}

updateNeighbourhoods(): void {
  if (!this.Filters?.Neighbourhood || !Array.isArray(this.Filters.Neighbourhood)) {
      // console.error('Neighbourhood list is empty or undefined.');
      this.neighbourhoods = [];
      return;
  }

  // 🔹 Ensure Neighbourhood is a string and sort
  this.neighbourhoods = [...this.Filters.Neighbourhood]
      .filter((n) => n?.Neighbourhood) // Remove undefined/null values
      .map((n) => ({
          Neighbourhood: String(n.Neighbourhood || '').trim(),
      }))
      .sort((a, b) => a.Neighbourhood.localeCompare(b.Neighbourhood));

  // console.log('Sorted Neighbourhoods:', this.neighbourhoods);
}

updateTenantCategories(): void {
  if (!this.Filters?.TenantsCategories || !Array.isArray(this.Filters.TenantsCategories)) {
      // console.error('TenantsCategories list is empty or undefined.');
      this.tenantCategories = [];
      return;
  }

  // 🔹 Remove duplicates and sort alphabetically
  const sortedList = [...this.Filters.TenantsCategories]
      .map((category) => ({
          TenantsCategoriesId: category.TenantsCategoriesId,
          Name: category.Name?.trim() || 'Unknown', // Ensure Name is valid
          ChildCategory: category.ChildCategory || [], // Ensure ChildCategory exists
          Selected: category.Selected || false,
      }))
      .sort((a, b) => a.Name.localeCompare(b.Name));

  this.tenantCategories = Array.from(new Set(sortedList)); // Remove duplicates

  // console.log('Sorted Tenant Categories:', this.tenantCategories);
}
applyBuildingSizeFilter(): void {
  if (!this.Filters?.Result || !Array.isArray(this.Filters.Result)) {
    console.warn('Building size data is missing or invalid.');
    this.filteredKayakResult = [];
    return;
  }

  console.log(`Filtering with min: ${this.filterValues.minsize}, max: ${this.filterValues.maxsize}`);

  // 🔹 Ensure `BuildingSize` exists before filtering
  this.filteredKayakResult = this.Filters.Result.filter((item: any) => {
    if (!item.BuildingSize || isNaN(item.BuildingSize)) {
      console.warn(`Skipping item with missing or invalid BuildingSize:`, item);
      return false;
    }
    return (
      item.BuildingSize >= this.filterValues.minsize &&
      item.BuildingSize <= this.filterValues.maxsize &&
      item.Type === 'ShoppingCenter' // Ensure filtering only applies to shopping centers
    );
  });

  console.log('Filtered Shopping Centers:', this.filteredKayakResult);
}

updateSliderValues(): void {
  // Update filterValues whenever the user changes the slider
  this.filterValues.minsize = this.selectedMin;
  this.filterValues.maxsize = this.selectedMax;

  console.log(`Updated filterValues: minsize=${this.filterValues.minsize}, maxsize=${this.filterValues.maxsize}`);
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

  getResult(): void {
    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };

    this.spinner.show();
    this.loading = true; // Set loading to true while fetching data

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json?.[0]) {
          this.KayakResult = data.json[0];

          if (!Array.isArray(this.KayakResult.Result)) {
            // console.warn(
            //   'KayakResult.Result is not an array:',
            //   this.KayakResult.Result
            // );
            this.KayakResult.Result = []; // Default to an empty array if not valid
          }

          this.KayakResult.Result = this.KayakResult.Result.filter(
            (result: any) => {
              return (
                result.MainImage &&
                result.CenterName &&
                result.CenterAddress &&
                result.CenterCity &&
                result.CenterState
              );
            }
          );

          // Initialize the filtered result to the full result
          this.filteredKayakResult = [...this.KayakResult.Result];
          this.Ids = this.KayakResult.Ids; // Update Ids for GetFilters
          // console.log('Filtered Result:', this.KayakResult);
        } else {
          // console.warn('Data does not contain expected structure:', data);
          this.KayakResult = { Result: [] }; // Default to a structure with an empty array
          this.filteredKayakResult = []; // Reset the filtered result
        }
        this.GetMarketSurveyShoppingCentersByBBoxId();
        this.GetMarketSurveyPlacesByBBoxId();
        this.spinner.hide();
        this.loading = false; // Set loading to false after fetching data
      },
      error: (error) => {
        console.error('Error fetching filtered results:', error);
        this.spinner.hide();
        this.loading = false; // Set loading to false even on error
      },
    });
  }
  
  getShoppingCenters(): void {
    this.spinner.show();
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
        this.spinner.hide();
        // this.getStandAlonePlaces(this.selectedbuyBox);
        // this.getBuyBoxPlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  GetFilters(): void {
    if (!this.Ids) {
      this.resetFilters();
      return;
    }
  
    this.spinner.show();
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
          console.log('Filters loaded:', this.Filters);
  
          // ✅ Extract Min/Max Building Size from API and store in filterValues
          if (this.Filters.MinMaxBuildingSize?.length > 0) {
            const minMax = this.Filters.MinMaxBuildingSize[0];
            this.minBuildingSize = minMax.MinSize;
            this.maxBuildingSize = minMax.MaxSize;
  
            // Set min/max in filterValues for dynamic filtering
            this.filterValues.minsize = this.minBuildingSize;
            this.filterValues.maxsize = this.maxBuildingSize;
  
            // Set slider values initially
            this.selectedMin = this.minBuildingSize;
            this.selectedMax = this.maxBuildingSize;
          } else {
            console.warn('No MinMaxBuildingSize data available.');
          }
  
          // Update all filters dynamically
          this.updateSortedTenants();
          this.updateSortedOrgs();
          this.updateSecondaryTypes();
          this.updateNeighbourhoods();
          this.updateTenantCategories();
          console.log(this.filterValues);
          
        } else {
          console.warn('No filters data returned.');
          this.resetFilters();
        }
  
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching filters:', error);
        this.spinner.hide();
        this.resetFilters();
      },
    });
  }
  
  

  resetFilters(): void {
    this.sortedTenants = [];
    this.sortedOrgs = [];
    this.secondaryTypes = [];
    this.neighbourhoods = [];
    this.tenantCategories = [];
  }

  GetStatesAndCities(): void {
    this.spinner.show();
    const body: any = { Name: 'GetStates', Params: {} };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakCitiesandStates = data.json;
        this.uniqueStates = [
          ...new Set(
            this.KayakCitiesandStates.map((item: any) => item.stateCode.trim())
          ),
        ];
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching states and cities:', error);
        this.spinner.hide();
      },
    });
  }

  handleStateChange(selectedValue: string): void {
    this.filterValues!.statecode = selectedValue; // Update the selected state
    this.filterValues!.city = ''; // Clear the city filter
    this.selectedCity = null; // Reset the selected city in the UI
    // console.log('State selected:', selectedValue);
    this.updateCitiesForSelectedState(); // Update city dropdown based on the selected state
    this.GetFilters(); // Fetch new filters for the state
    this.getResult(); // Fetch results for the selected state
  }

  onCityChange(selectedValue: string): void {
    this.filterValues!.city = selectedValue; // Update the selected city
    // console.log('City selected:', selectedValue);
    this.GetFilters(); // Fetch new filters for the city
    this.getResult(); // Fetch results for the selected city
  } 

  updateCitiesForSelectedState(): void {
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode === this.filterValues.statecode
    );
    // console.log(
    //   'Updated cities for state:',
    //   this.filterValues.statecode,
    //   this.uniqueCities
    // );
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

    this.filterValues.tenants = tenantIds.join(','); // Update tenant filters
    this.getResult(); // Fetch filtered cards only
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

    this.filterValues.managementOrganizationIds = orgIds.join(','); // Update organization filters
    this.getResult(); // Fetch filtered cards only
  }
  toggleSecondaryTypeSelection(secondary: SecondaryType): void {
    const currentSecondaryTypes = this.filterValues.secondarytype || ''; // Ensure it's a string
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

    this.filterValues.secondarytype = secondaryTypeList.join(','); // Update the filter
    this.getResult(); // Trigger filtering API
  }
  toggleNeighbourhoodSelection(neighbourhood: Neighbourhood): void {
    if (!neighbourhood.Neighbourhood) {
      console.warn('Neighbourhood is undefined, skipping selection.');
      return;
    }

    const currentNeighbourhoods = this.filterValues.neighbourhood || ''; // Ensure it's a string
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

    this.filterValues.neighbourhood = neighbourhoodList.join(','); // Update the filter
    this.getResult(); // Trigger filtering API
  }
  toggleTenantCategorySelection(category: TenantsCategories): void {
    const currentCategories = this.filterValues.tenantCategory || ''; // Ensure it's a string
    let categoryList = currentCategories
      .split(',')
      .filter((name: any) => name.trim());

    if (!categoryList.includes(category.Name)) {
      categoryList.push(category.Name);
    } else {
      categoryList = categoryList.filter((name: any) => name !== category.Name);
    }

    this.filterValues.tenantCategory = categoryList.join(','); // Update the filter
    this.getResult(); // Trigger filtering API
  }

  searchShoppingCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakResult = data.json[0];
        this.Ids = data.json[0]?.Ids;
        this.filterCards();
        console.log('Filtered Result:', this.KayakResult);        
        this.GetFilters();
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

 
}
