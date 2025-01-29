import { Organization } from './../../../../models/userKanban';
import { Component, OnInit, TemplateRef,  ChangeDetectorRef,  NgZone, ViewChild,HostListener 

} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from '../../../../app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { KayakResult, StatesAndCities } from '../../../../models/kayak';
import { AllPlaces, AnotherPlaces, General, Property } from './../../../../../src/models/domain';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MapsService } from './../../../../../src/app/services/maps.service';


import {
  FilterValues,
  KayakFilters,
  ManagementOrganization,
  Tenant,
  SecondaryType, // Import SecondaryType
  Neighbourhood, // Import Neighbourhood
  TenantsCategories, // Import TenantsCategories
} from '../../../../models/filters';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SortByPipe } from '../../../pipes/sortBy/sort-by.pipe';
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
  filtered!: any;
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
  formSearch: boolean = false;
  sortedTenants: Tenant[] = []; 
  showAllTenants: boolean = false; 
  sortedOrgs: ManagementOrganization[] = []; 
  showAllOrgs: boolean = false; 
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  mapViewOnePlacex: boolean = false;
  ShoppingCenterAvailability: any = null; 
  ShoppingCenterTenants: any = null; 
  isDropdownOpen: boolean = false;
  isDropdownOpenIndex: number | null = null; // Track which card's dropdown is open
  showMorePlaces: boolean = false; // Track if additional places should be shown
  showAllPlacesIndex: number | null = null; // Track which card's places are fully visible
  showAllSqft: boolean = false; // Toggle to show all or limited sqft results
  selectedbuyBox!: string;
  SelectedShoppingCenterIDs: number[] = []; // To store selected shopping center IDs
  SelectedPlacesIDs: number[]=[];
  shoppingCenters: { id: number; name: string }[] = []; // Example shopping centers list
  loading: boolean = true; // Add a loading flag
  isBulkMode: boolean = false; // Default: Bulk mode is off
  selectedPlaces: any[] = []; // Holds the selected places for the modal
  expandedPlacesIndex: number | null = null; // Keeps track of the card whose places are expanded
  showFilters: boolean = false;
  secondaryTypes: any[] = [];
  neighbourhoods: any[] = [];
tenantCategories: any[] = [];
selectedShoppingCenterId: number = 0; // You can initialize it with 0, or a default value of your choice
boundShoppingCenterIds: number[] = [];  // This will store the shopping center IDs returned by the API
newBoundShoppingCenterIds: number[] = [];  // Store the shopping center IDs the user explicitly binds















  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,


  ) {    this.markerService.clearMarkers();
  }

  ngOnInit(): void {
    this.General = new General();
    this.filterValues = {
      statecode: '',
      city: '',
      neighbourhood: '', // Selected neighbourhood
      availabilty: false,
      sqft: 0,
      secondarytype: '', // Selected secondary type
      tenants: '', // Selected tenants
      tags: '', // Selected tags
      managementOrganizationIds: '', // Selected management organizations
      minsize: 0,
      maxsize: 0,
      tenantCategory: '', // New field for selected tenant category
    };
    this.getResult(); 
    this.GetStatesAndCities(); 
    this.GetFilters(); 


   // Extract the ID from the route and assign it to selectedbuyBox
   this.activatedRoute.params.subscribe((params) => {
    this.selectedbuyBox = params['buyboxid']; // 'id' matches the route configuration
    console.log('Extracted ID from URL:', this.selectedbuyBox);
  });


  }

  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    }
  }

toggleFilters(): void {
  this.showFilters = !this.showFilters;
}
  toggleExpandedPlaces(index: number): void {
    this.expandedPlacesIndex = this.expandedPlacesIndex === index ? null : index; // Toggle expansion
  }
  openModal(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }
  @ViewChild('placesModal', { static: true }) placesModal!: TemplateRef<any>; // Bind the modal template

  openPlacesModal(places: any[], shoppingCenterId: number): void {
    this.selectedPlaces = places;  // Assign places to selectedPlaces array
    this.selectedShoppingCenterId = shoppingCenterId;  // Store the shopping center ID
    this.modalService.open(this.placesModal, { size: 'lg', centered: true });
  }
  
  selectedButton: string = 'explore'; // Default selected button

  selectButton(button: string): void {
    this.selectedButton = button; // Update the selected button
  }
  toggleBulkMode(): void {
    this.isBulkMode = !this.isBulkMode; // Toggle bulk mode
  }

  bindShoppingCenter(): void {
    this.spinner.show();
  
    console.log('Bound Shopping Center IDs:', this.boundShoppingCenterIds);
  
    const body: any = {
      Name: 'BindShoppingCenters',
      Params: {
        buyboxid: this.selectedbuyBox, 
        state: this.filterValues.statecode || '', 
        city: this.selectedCity || '', 
        shoppingcenterIds: this.boundShoppingCenterIds.join(','), 
        placeIds: this.SelectedPlacesIDs.join(','), 
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          console.log('Response from BindShoppingCenters:', res.json);
        }
        this.spinner.hide(); 
      },
      error: (err) => {
        console.error('Error in BindShoppingCenters:', err);
        this.spinner.hide(); 
      },
    });
  }
  
  GetMarketSurveyShoppingCentersByBBoxId(): void {
    this.spinner.show(); 
  
    console.log('Selected BuyBox ID:', this.selectedbuyBox);
  
    const body: any = {
      Name: 'GetMarketSurveyShoppingCentersByBBoxId',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          this.boundShoppingCenterIds = res.json.map((item: any) => item.shoppingCenterId);
  
          console.log('Response from GetMarketSurveyShoppingCentersByBBoxId:', res.json);
          console.log('Bound Shopping Center IDs:', this.boundShoppingCenterIds);

        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error in GetMarketSurveyShoppingCentersByBBoxId:', err);
        this.spinner.hide(); 
      },
    });
  }
  
  toggleShoppingCenterBind(shoppingCenterId: number): void {
    const isAlreadyBound = this.boundShoppingCenterIds.includes(shoppingCenterId);
  
    if (isAlreadyBound) {
      this.boundShoppingCenterIds = this.boundShoppingCenterIds.filter(id => id !== shoppingCenterId);
      
      console.log(`Unbound shopping center with ID: ${shoppingCenterId}`);
    } else {
      this.boundShoppingCenterIds.push(shoppingCenterId);
      console.log(`Bound shopping center with ID: ${shoppingCenterId}`);
    }
  
    this.bindShoppingCenter();
  }
  
  getMarketSurveyPlacesByBBoxId(): void {
    this.spinner.show();
  
    console.log('Selected BuyBox ID:', this.selectedbuyBox);
  
    const body: any = {
      Name: 'GetMarketSurveyPlacesByBBoxId',
      Params: {
        buyboxid: this.selectedbuyBox, 
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          console.log('Response from GetMarketSurveyPlacesByBBoxId:', res.json);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error in GetMarketSurveyPlacesByBBoxId:', err);
        this.spinner.hide();
      },
    });
  }
  
  selectedshoppingcenterid(selectedid: number): void {
    if (selectedid) { 
      this.SelectedShoppingCenterIDs.push(selectedid);
      console.log('Selected IDs:', this.SelectedShoppingCenterIDs); 
      this.bindShoppingCenter(); 
    } else {
      console.error('Invalid ID:', selectedid); 
    }
  }
  onPlaceCheckboxChange(event: Event, placeId: number): void {
    const isChecked = (event.target as HTMLInputElement).checked; 
  
    if (isChecked) {
     
      this.addPlaceId(placeId);
      if (!this.SelectedShoppingCenterIDs.includes(this.selectedShoppingCenterId)) {
        this.SelectedShoppingCenterIDs.push(this.selectedShoppingCenterId);
      }
    } else {
      this.removePlaceId(placeId);
      if (!this.selectedPlacesForShoppingCenter(this.selectedShoppingCenterId)) {
        const index = this.SelectedShoppingCenterIDs.indexOf(this.selectedShoppingCenterId);
        if (index > -1) {
          this.SelectedShoppingCenterIDs.splice(index, 1);
        }
      }
    }
  
    console.log('Updated Selected Places IDs:', this.SelectedPlacesIDs);
    this.bindShoppingCenter();
  }
  addShoppingCenterId(shoppingCenterId: number): void {
    if (!this.SelectedShoppingCenterIDs.includes(shoppingCenterId)) {
      this.SelectedShoppingCenterIDs.push(shoppingCenterId);
    }
  }
  
  removeShoppingCenterId(shoppingCenterId: number): void {
    const index = this.SelectedShoppingCenterIDs.indexOf(shoppingCenterId);
    if (index > -1) {
      this.SelectedShoppingCenterIDs.splice(index, 1);
    }
  }
  
  addPlaceId(placeId: number): void {
    if (!this.SelectedPlacesIDs.includes(placeId)) {
      this.SelectedPlacesIDs.push(placeId);
    }
  }
  
  removePlaceId(placeId: number): void {
    const index = this.SelectedPlacesIDs.indexOf(placeId);
    if (index > -1) {
      this.SelectedPlacesIDs.splice(index, 1);
    }
  }
  onCardCheckboxChange(event: Event, result: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;  // Check if the checkbox is checked
    const shoppingCenterId = result.Id;  // Get the shopping center ID
  
    if (isChecked) {
      // If checked, add shopping center ID to SelectedShoppingCenterIDs
      this.addShoppingCenterId(shoppingCenterId);
    } else {
      // If unchecked, remove shopping center ID from SelectedShoppingCenterIDs
      this.removeShoppingCenterId(shoppingCenterId);
    }
  
    console.log('Updated Selected Shopping Center IDs:', this.SelectedShoppingCenterIDs);
    this.bindShoppingCenter(); // Trigger API call to update
  }
  selectedPlacesForShoppingCenter(shoppingCenterId: number): boolean {
    // Check if there are any places selected for this shopping center
    return this.SelectedPlacesIDs.some(placeId => {
      return this.selectedPlaces.some(place => place.Id === placeId && place.ShoppingCenterId === shoppingCenterId);
    });
  }
  bindPlace(placeId: number, shoppingCenterId: number): void {
    // Check if the placeId is already in the SelectedPlacesIDs array
    const placeIndex = this.SelectedPlacesIDs.indexOf(placeId);
  
    if (placeIndex > -1) {
      // If the placeId is found, remove it (unbind place)
      this.SelectedPlacesIDs.splice(placeIndex, 1);
      console.log(`Unbound place with ID: ${placeId}`);
    } else {
      // If the placeId is not found, add it (bind place)
      this.SelectedPlacesIDs.push(placeId);
      console.log(`Bound place with ID: ${placeId}`);
    }
  
    // Check if the shoppingCenterId is already in the SelectedShoppingCenterIDs array
    const centerIndex = this.SelectedShoppingCenterIDs.indexOf(shoppingCenterId);
  
    if (centerIndex > -1) {
      // If the shoppingCenterId is found, remove it (unbind shopping center)
      this.SelectedShoppingCenterIDs.splice(centerIndex, 1);
      console.log(`Unbound shopping center with ID: ${shoppingCenterId}`);
    } else {
      // If the shoppingCenterId is not found, add it (bind shopping center)
      this.SelectedShoppingCenterIDs.push(shoppingCenterId);
      console.log(`Bound shopping center with ID: ${shoppingCenterId}`);
    }
  
    // Call the method to bind shopping centers and places
    this.bindShoppingCenter(); // Send the selected IDs to the API
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
          console.log('Shopping Center Availability:', this.ShoppingCenterAvailability);
        }
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching Shopping Center Availability:', error);
        this.spinner.hide();
      },
    });
  }
  handleSecondaryTypeChange(selectedValue: string): void {
    this.filterValues.secondarytype = selectedValue; // Update the secondary type
    this.getResult(); // Fetch filtered results
  }
  fetchAvailability(shoppingCenterId: number): void {
    console.log('Fetching availability for Shopping Center ID:', shoppingCenterId);
    this.GetShoppingCenterAvailability(shoppingCenterId);
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
          this.ShoppingCenterTenants = data.json; // Populate tenants
          console.log('Fetched Tenants:', this.ShoppingCenterTenants); // Debugging
          this.modalService.open(this.tenantModal, { size: 'lg', centered: true }); // Open modal
        } else {
          this.ShoppingCenterTenants = []; // Handle no data scenario
        }
        this.spinner.hide();
      },
      error: (error: any) => {
        console.error('Error fetching Shopping Center Tenants:', error);
        this.spinner.hide();
      },
    });
  }
  

  fetchTenants(shoppingCenterId: number): void {
    console.log('Fetching tenants for Shopping Center ID:', shoppingCenterId);
    this.GetShoppingCenterTenants(shoppingCenterId);
  }
  
  
  @ViewChild('galleryModal', { static: true }) galleryModal: any;

  openGallery(index: number): void {
    // Get the images for the specific row
    const result = this.KayakResult.Result[index];
    if (result?.Images) {
      this.placeImage = result.Images.split(',').map((link: string) => link.trim());
    } else {
      this.placeImage = [];
    }

    console.log('Images for Gallery:', this.placeImage);

    // Open the gallery modal
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
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  openFiltersModal(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
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
  
  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }
  // toggleTenantList(): void {
  //   this.showAllTenants = !this.showAllTenants;
  //   this.updateSortedTenants(); 
  // }
   // toggleOrgSelect(org: ManagementOrganization): void {
  //   const currentOrgs = this.filterValues.managementOrganizationIds || '';
  
  //   let orgIds = currentOrgs
  //     .split(',')
  //     .map((id: any) => id.trim())
  //     .filter((id: any) => id !== '');
  
  //   const orgIdAsString = String(org.OrganizationId);
  
  //   if (org.Selected) {
   
  //     if (!orgIds.includes(orgIdAsString)) {
  //       orgIds.push(orgIdAsString);
  //     }
  //   } else {
  //     orgIds = orgIds.filter((id: any) => id !== orgIdAsString);
  //   }
  
  //   this.filterValues.managementOrganizationIds = orgIds.join(',');
  //   console.log('Updated Management Organization Filter:', this.filterValues.managementOrganizationIds);
  
  //   this.getResult();
  // }
  

  updateSortedTenants(): void {
    if (!this.Filters?.Tenants || !Array.isArray(this.Filters.Tenants)) {
      console.error('Tenants list is empty or undefined.');
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
    console.log('Sorted Tenants:', this.sortedTenants); // Debug tenants
  }
  
  
  updateSortedOrgs(): void {
    if (!this.Filters?.ManagementOrganization || !Array.isArray(this.Filters.ManagementOrganization)) {
      console.error('ManagementOrganization list is empty or undefined.');
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
    console.log('Sorted Organizations:', this.sortedOrgs); // Debug organizations
  }
  updateSecondaryTypes(): void {
    if (!this.Filters?.SecondaryType || !Array.isArray(this.Filters.SecondaryType)) {
      console.error('Secondary types are empty or undefined.');
      this.secondaryTypes = [];
      return;
    }
  
    this.secondaryTypes = [...this.Filters.SecondaryType];
    console.log('Secondary Types:', this.secondaryTypes); // Debug secondary types
  }
  
  updateNeighbourhoods(): void {
    if (!this.Filters?.Neighbourhood || !Array.isArray(this.Filters.Neighbourhood)) {
      console.error('Neighbourhood list is empty or undefined.');
      this.neighbourhoods = [];
      return;
    }
  
    // Assign all Neighbourhood values from Filters
    this.neighbourhoods = [...this.Filters.Neighbourhood];
  
    console.log('Neighbourhoods:', this.neighbourhoods); // Debug neighbourhoods
  }
  updateTenantCategories(): void {
    if (!this.Filters?.TenantsCategories || !Array.isArray(this.Filters.TenantsCategories)) {
      console.error('TenantsCategories list is empty or undefined.');
      this.tenantCategories = [];
      return;
    }
  
    // Assign all TenantCategories values from Filters
    this.tenantCategories = [...this.Filters.TenantsCategories];
  
    console.log('Tenant Categories:', this.tenantCategories); // Debug tenant categories
  }
  
  
  toggleOrgList(): void {
    this.showAllOrgs = !this.showAllOrgs;
    this.updateSortedOrgs(); 
  }
  filterCards(): void {
    if (!this.KayakResult?.Result) {
      this.filteredKayakResult = []; // Ensure filtered result is empty if no data.
      return;
    }
  
    const search = this.searchTerm.toLowerCase();
  
    this.filteredKayakResult = this.KayakResult.Result.filter((result: any) =>
      result.CenterName.toLowerCase().includes(search) ||
      result.CenterAddress.toLowerCase().includes(search) ||
      result.CenterCity.toLowerCase().includes(search) ||
      result.CenterState.toLowerCase().includes(search)
    );
  
    console.log('Filtered Cards:', this.filteredKayakResult);
  }
  getResult(): void {
    console.log('Filtering with values:', this.filterValues);
  
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
            console.warn('KayakResult.Result is not an array:', this.KayakResult.Result);
            this.KayakResult.Result = []; // Default to an empty array if not valid
          }
  
          this.KayakResult.Result = this.KayakResult.Result.filter((result: any) => {
            return (
              result.MainImage &&
              result.CenterName &&
              result.CenterAddress &&
              result.CenterCity &&
              result.CenterState
            );
          });
  
          // Initialize the filtered result to the full result
          this.filteredKayakResult = [...this.KayakResult.Result];
          this.Ids = this.KayakResult.Ids; // Update Ids for GetFilters
          console.log('Filtered Result:', this.KayakResult);
        } else {
          console.warn('Data does not contain expected structure:', data);
          this.KayakResult = { Result: [] }; // Default to a structure with an empty array
          this.filteredKayakResult = []; // Reset the filtered result
        }
        this.GetMarketSurveyShoppingCentersByBBoxId();
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
  
  
  GetFilters(): void {
    if (!this.Ids) {
      console.warn('Ids are not available, resetting filters.');
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
  
          // Update all filters dynamically
          this.updateSortedTenants();
          this.updateSortedOrgs();
          this.updateSecondaryTypes();
          this.updateNeighbourhoods();
          this.updateTenantCategories();
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
        this.uniqueStates = [...new Set(this.KayakCitiesandStates.map((item: any) => item.stateCode.trim()))];
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching states and cities:', error);
        this.spinner.hide();
      },
    });
  }
  onStateChange(): void {
    this.selectedState = this.filterValues.statecode;
    console.log(this.selectedState);
    
    this.updateCitiesForSelectedState();
    this.selectedCity = null; // Reset city
    this.filterValues.city = '';
    this.getResult(); // Trigger only for shopping centers
  }
  handleStateChange(selectedValue: string): void {
    this.filterValues.statecode = selectedValue; // Update the selected state
    this.filterValues.city = ''; // Clear the city filter
    this.selectedCity = null; // Reset the selected city in the UI
    console.log('State selected:', selectedValue);
    this.updateCitiesForSelectedState(); // Update city dropdown based on the selected state
    this.GetFilters(); // Fetch new filters for the state
    this.getResult(); // Fetch results for the selected state
  }
  
  onCityChange(selectedValue: string): void {
    this.filterValues.city = selectedValue; // Update the selected city
    console.log('City selected:', selectedValue);
  
    this.GetFilters(); // Fetch new filters for the city
    this.getResult(); // Fetch results for the selected city
  }
  handleNeighbourhoodChange(selectedValue: string): void {
    this.filterValues.neighbourhood = selectedValue; // Update the selected neighbourhood
    console.log('Neighbourhood selected:', selectedValue);
    this.getResult(); // Fetch filtered results
  }
  handleTenantCategoryChange(selectedValue: string): void {
    this.filterValues.tenantCategory = selectedValue; // Update the selected tenant category
    console.log('Tenant Category selected:', selectedValue);
    this.getResult(); // Fetch filtered results
  }
  
  updateCitiesForSelectedState(): void {
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode === this.filterValues.statecode
    );
    console.log('Updated cities for state:', this.filterValues.statecode, this.uniqueCities);
  }

  getCitiesOfState() {
    this.selectedCity = '';
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode == this.filterValues?.statecode
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
    let secondaryTypeList = currentSecondaryTypes.split(',').filter((type: any) => type.trim());
  
    if (!secondaryTypeList.includes(secondary.SecondaryType)) {
      secondaryTypeList.push(secondary.SecondaryType);
    } else {
      secondaryTypeList = secondaryTypeList.filter((type: any) => type !== secondary.SecondaryType);
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
  let neighbourhoodList = currentNeighbourhoods.split(',').filter((name: string) => name.trim());

  if (!neighbourhoodList.includes(neighbourhood.Neighbourhood)) {
    neighbourhoodList.push(neighbourhood.Neighbourhood);
  } else {
    neighbourhoodList = neighbourhoodList.filter((name: string) => name !== neighbourhood.Neighbourhood);
  }

  this.filterValues.neighbourhood = neighbourhoodList.join(','); // Update the filter
  this.getResult(); // Trigger filtering API
}
  toggleTenantCategorySelection(category: TenantsCategories): void {
    const currentCategories = this.filterValues.tenantCategory || ''; // Ensure it's a string
    let categoryList = currentCategories.split(',').filter((name: any) => name.trim());
  
    if (!categoryList.includes(category.Name)) {
      categoryList.push(category.Name);
    } else {
      categoryList = categoryList.filter((name: any) => name !== category.Name);
    }
  
    this.filterValues.tenantCategory = categoryList.join(','); // Update the filter
    this.getResult(); // Trigger filtering API
  }
  handleAvailabilityChange(): void {
    console.log('Availability changed:', this.filterValues.availabilty);
  
    // Update filter values
    this.filterValues.availabilty = !!this.filterValues.availabilty;
  
    // Trigger filtering API
    this.getResult();
  }
  handleSqftChange(): void {
    console.log('Sqft changed:', this.filterValues.sqft);
  
    // Prevent invalid sqft values
    if (this.filterValues.sqft < 0) {
      this.filterValues.sqft = 0;
    }
  
    // Trigger filtering API
    this.getResult();
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

        if (!this.Filters?.SecondaryType) {
          this.GetFilters();
        }

        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  openTagsModal(content: TemplateRef<any>): void {
    this.modalService.open(content, { size: 'lg' });
    this.showDefaultTags();
    this.GetTags();
  }
  showDefaultTags(): void {
    this.visibleTags = this.tags.slice(0, 10); // Show the first 10 tags by default
  }
  GetTags(): void {
    const body: any = {
      Name: 'GetTags',
      MainEntity: null,
      Params: {},
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.tags = data.json;
        this.visibleTags = this.tags.slice(0, 10); // Show first 10 tags by default
      },
      error: (err) => {
        console.error('Error fetching tags:', err);
      },
    });
  }

  filterTags(): void {
    if (this.searchTerm) {
      this.visibleTags = this.tags.filter((tag) =>
        tag.tag.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.visibleTags = this.tags.slice(0, 10); // Reset to default
    }
}

  toggleTagSelection(tag: any): void {
    const index = this.selectedTags.findIndex((t) => t.tag === tag.tag);
  
    // Toggle logic for this.selectedTags
    if (index > -1) {
      // Remove if already selected
      this.selectedTags.splice(index, 1);
    } else {
      // Add if not selected
      this.selectedTags.push(tag);
    }
  
    // Update isSelected property in the main tags array (for the modal)
    const modalTagIndex = this.tags.findIndex((t) => t.tag === tag.tag);
    if (modalTagIndex > -1) {
      // If index is -1, it means we are adding it (so isSelected=true)
      this.tags[modalTagIndex].isSelected = (index === -1);
    }
  
    // Create a comma-separated string of all tags that are isSelected == true
    // (use the main "tags" array or "selectedTags" — here, "tags" is more reliable if you want to ensure isSelected is accurate)
    const selectedTagObjects = this.tags.filter(t => t.isSelected);
    const selectedTagNames   = selectedTagObjects.map(t => t.tag);
  
    // Store comma-separated tags in filterValues
    this.filterValues.tags = selectedTagNames.join(',');
  
   }
  
  isTagSelected(tag: any): boolean {
    return this.selectedTags.some((t) => t.tag === tag.tag);
  }

  removeTag(tag: any): void {
    this.selectedTags = this.selectedTags.filter((t) => t.tag !== tag.tag);
    const modalTagIndex = this.tags.findIndex((t) => t.tag === tag.tag);
    if (modalTagIndex > -1) {
      this.tags[modalTagIndex].isSelected = false; 
    }
  }

  applyTags(): void {
    const selectedTagsJson = this.selectedTags.map((tag) => ({ tag: tag.tag }));
    this.modalService.dismissAll();
  }
  toggleDropdown(index: number): void {
    this.isDropdownOpenIndex = this.isDropdownOpenIndex === index ? null : index;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.circle-container') && !target.closest('.custom-dropdown')) {
      this.isDropdownOpenIndex = null; 
    }
  }

  
  
  
  
}
