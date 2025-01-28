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
  shoppingCenters: { id: number; name: string }[] = []; // Example shopping centers list
  loading: boolean = true; // Add a loading flag
  isBulkMode: boolean = false; // Default: Bulk mode is off
  selectedPlaces: any[] = []; // Holds the selected places for the modal
  expandedPlacesIndex: number | null = null; // Keeps track of the card whose places are expanded
  showFilters: boolean = false;
  secondaryTypes: any[] = [];
  neighbourhoods: any[] = [];
tenantCategories: any[] = [];











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

  openPlacesModal(places: any[]): void {
    this.selectedPlaces = places || []; // Assign places to selectedPlaces
    this.modalService.open(this.placesModal, { size: 'lg', centered: true });
  }
  selectedButton: string = 'explore'; // Default selected button

  selectButton(button: string): void {
    this.selectedButton = button; // Update the selected button
  }
  toggleBulkMode(): void {
    this.isBulkMode = !this.isBulkMode; // Toggle bulk mode
  }
  toggleShoppingCenterSelection(id: number): void {
    if (this.SelectedShoppingCenterIDs.includes(id)) {
      // Remove ID if already selected
      this.SelectedShoppingCenterIDs = this.SelectedShoppingCenterIDs.filter((selectedId) => selectedId !== id);
    } else {
      // Add ID if not already selected
      this.SelectedShoppingCenterIDs.push(id);
    }
  }
  bindShoppingCenter(): void {
    this.spinner.show(); // Show spinner while processing
  
    const body: any = {
      Name: 'BindShoppingCenters',
      Params: {
        buyboxid: this.selectedbuyBox, // Use the ID from the URL
        state: this.selectedState || '', // Ensure a value is sent, even if empty
        city: this.selectedCity || '', // Ensure a value is sent, even if empty
        shoppingcenterIds: this.SelectedShoppingCenterIDs.join(','), // Selected shopping centers
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          console.log('Response from BindShoppingCenters:', res.json);
        }
        this.spinner.hide(); // Hide spinner after processing
      },
      error: (err) => {
        console.error('Error in BindShoppingCenters:', err);
        this.spinner.hide(); // Hide spinner on error
      },
    });
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
  
    // Copy all tenants from Filters
    const tenantList = [...this.Filters.Tenants];
  
    // Sort tenants alphabetically by Name
    const sortedList = tenantList.sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );
  
    // Remove duplicate tenants based on OrganizationId
    const uniqueTenants = Array.from(
      new Set(sortedList.map((tenant) => tenant.OrganizationId))
    )
      .map((id) => sortedList.find((tenant) => tenant.OrganizationId === id))
      .filter((tenant): tenant is Tenant => tenant !== undefined);
  
    // Assign all unique, sorted tenants to sortedTenants
    this.sortedTenants = uniqueTenants;
  
    console.log('Sorted Tenants:', this.sortedTenants); // Debug tenants
  }
  
  updateSortedOrgs(): void {
    if (!this.Filters?.ManagementOrganization || !Array.isArray(this.Filters.ManagementOrganization)) {
      console.error('ManagementOrganization list is empty or undefined.');
      this.sortedOrgs = [];
      return;
    }
  
    // Copy all organizations from Filters
    const orgList = [...this.Filters.ManagementOrganization];
  
    // Sort organizations alphabetically by Name
    const sortedList = orgList.sort((a, b) =>
      (a.Name || '').localeCompare(b.Name || '')
    );
  
    // Remove duplicate organizations based on OrganizationId
    const uniqueOrgs = Array.from(
      new Set(sortedList.map((org) => org.OrganizationId))
    )
      .map((id) => sortedList.find((org) => org.OrganizationId === id))
      .filter((org): org is ManagementOrganization => org !== undefined);
  
    // Assign all unique, sorted organizations to sortedOrgs
    this.sortedOrgs = uniqueOrgs;
  
    console.log('Sorted Organizations:', this.sortedOrgs); // Debug organizations
  }
  updateSecondaryTypes(): void {
    if (!this.Filters?.SecondaryType || !Array.isArray(this.Filters.SecondaryType)) {
      console.error('SecondaryType list is empty or undefined.');
      this.secondaryTypes = [];
      return;
    }
  
    // Assign all SecondaryType values from Filters
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
  getResult(updateFilters: boolean = true): void {
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
  
          // Update the filtered cards
          this.filteredKayakResult = [...this.KayakResult.Result];
          this.Ids = this.KayakResult.Ids; // Update Ids for GetFilters
          console.log('Filtered Result:', this.KayakResult);
  
          // Only update filters if `updateFilters` is true
          if (updateFilters) {
            this.GetFilters();
          }
        } else {
          console.warn('Data does not contain expected structure:', data);
          this.KayakResult = { Result: [] }; // Default to a structure with an empty array
          this.filteredKayakResult = []; // Reset the filtered result
        }
  
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
      console.warn('Ids are not available, resetting tenants, organizations, secondary types, neighbourhoods, and tenant categories.');
      this.sortedTenants = [];
      this.sortedOrgs = [];
      this.secondaryTypes = [];
      this.neighbourhoods = [];
      this.tenantCategories = [];
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
          this.sortedTenants = [];
          this.sortedOrgs = [];
          this.secondaryTypes = [];
          this.neighbourhoods = [];
          this.tenantCategories = [];
        }
  
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching filters:', error);
        this.spinner.hide();
  
        // Reset all filters on error
        this.sortedTenants = [];
        this.sortedOrgs = [];
        this.secondaryTypes = [];
        this.neighbourhoods = [];
        this.tenantCategories = [];
      },
    });
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
    this.updateCitiesForSelectedState();
    this.selectedCity = null; // Reset city
    this.filterValues.city = '';
    this.getResult(); // Trigger only for shopping centers
  }
  handleStateChange(selectedValue: string): void {
    this.filterValues.statecode = selectedValue; // Update the selected state
    console.log('State selected:', selectedValue);
  
    this.updateCitiesForSelectedState(); // Update cities based on selected state
    this.getResult(); // Fetch results for the selected state
  }
  
  onCityChange(): void {
    this.selectedCity = this.filterValues.city;
    this.getResult(); // Trigger only for shopping centers
    this.selectedCity='';
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
      (s) => !this.filterValues.statecode || s.stateCode === this.filterValues.statecode
    );
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
    this.getResult(false); // Fetch cards only
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
    this.getResult(false); // Fetch cards only
  }
  
  toggleSecondaryTypeSelection(secondary: SecondaryType): void {
    const currentSecondaryTypes = this.filterValues.secondarytype || '';
    let secondaryTypeList = currentSecondaryTypes.split(',').filter((type: any) => type.trim());
  
    if (!secondaryTypeList.includes(secondary.SecondaryType)) {
      secondaryTypeList.push(secondary.SecondaryType);
    } else {
      secondaryTypeList = secondaryTypeList.filter((type: any) => type !== secondary.SecondaryType);
    }
  
    this.filterValues.secondarytype = secondaryTypeList.join(','); // Update the filter
    this.getResult(false); // Fetch cards only
  }
  
  toggleNeighbourhoodSelection(neighbourhood: Neighbourhood): void {
    if (!neighbourhood.Neighbourhood) {
      console.warn('Neighbourhood is undefined, skipping selection.');
      return;
    }
  
    const currentNeighbourhoods = this.filterValues.neighbourhood || '';
    let neighbourhoodList = currentNeighbourhoods.split(',').filter((name: string) => name.trim());
  
    if (!neighbourhoodList.includes(neighbourhood.Neighbourhood)) {
      neighbourhoodList.push(neighbourhood.Neighbourhood);
    } else {
      neighbourhoodList = neighbourhoodList.filter((name: string) => name !== neighbourhood.Neighbourhood);
    }
  
    this.filterValues.neighbourhood = neighbourhoodList.join(','); // Update the filter
    this.getResult(false); // Fetch cards only
  }
  
  toggleTenantCategorySelection(category: TenantsCategories): void {
    const currentCategories = this.filterValues.tenantCategory || '';
    let categoryList = currentCategories.split(',').filter((name: any) => name.trim());
  
    if (!categoryList.includes(category.Name)) {
      categoryList.push(category.Name);
    } else {
      categoryList = categoryList.filter((name: any) => name !== category.Name);
    }
  
    this.filterValues.tenantCategory = categoryList.join(','); // Update the filter
    this.getResult(false); // Fetch cards only
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
  getVisiblePlaces(result: any, index: number): any[] {
    if (!result?.place) {
      return [];
    }
    // Check if the current index matches the expanded card
    return this.showAllPlacesIndex === index ? result.place : result.place.slice(0, 2);
  }
  
  toggleSeeMorePlaces(index: number): void {
    this.showAllPlacesIndex = this.showAllPlacesIndex === index ? null : index;
  }
  
  onCardCheckboxChange(event: Event, result: any, index: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    if (isChecked) {
      console.log(`Checkbox selected for card index ${index}`, result);
      this.toggleShoppingCenterSelection(result.Id); // Add ID to the list
    } else {
      console.log(`Checkbox deselected for card index ${index}`);
      this.toggleShoppingCenterSelection(result.Id); // Remove ID from the list
    }
    console.log('Updated Selected Shopping Center IDs:', this.SelectedShoppingCenterIDs);
  }
}
