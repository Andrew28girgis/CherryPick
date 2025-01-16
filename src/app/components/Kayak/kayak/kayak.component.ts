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
  formSearch: boolean = false;
  sortedTenants: Tenant[] = []; // To hold the sorted tenants
  showAllTenants: boolean = false; // Default to show limited tenants
  sortedOrgs: ManagementOrganization[] = []; // To hold the sorted organizations
  showAllOrgs: boolean = false; // Default to show limited organizations
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  mapViewOnePlacex: boolean = false;
  ShoppingCenterAvailability: any = null; // Store API response
  ShoppingCenterTenants: any = null; // Store API response
  isDropdownOpen: boolean = false;
  isDropdownOpenIndex: number | null = null; // Track which card's dropdown is open
  showMorePlaces: boolean = false; // Track if additional places should be shown
  showAllPlacesIndex: number | null = null; // Track which card's places are fully visible
  showAllSqft: boolean = false; // Toggle to show all or limited sqft results







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
      neighbourhood: '',
      availabilty: false,
      sqft: 0,
      secondarytype: '',
      tenants: '',
      tags: '',
      managementOrganizationIds: '',
      minsize: 0,
      maxsize: 0,
    };
    this.getResult(); 
    this.GetStatesAndCities(); 
    this.GetFilters(); 
 

  }

  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    }
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
  toggleTenantList(): void {
    this.showAllTenants = !this.showAllTenants;
    this.updateSortedTenants(); // Update the tenant list based on the toggle
  }
  

  updateSortedTenants(): void {
    if (!this.Filters?.Tenants || this.Filters.Tenants.length === 0) {
      console.error('Tenants list is empty or undefined.');
      this.sortedTenants = [];
      return;
    }
  
    // Sort tenants alphabetically
    const sortedList = [...this.Filters.Tenants].sort((a, b) => {
      const nameA = a.Name || '';
      const nameB = b.Name || '';
      return nameA.localeCompare(nameB);
    });
  
    // Deduplicate tenants
    const uniqueTenants = Array.from(
      new Set(sortedList.map((tenant) => tenant.OrganizationId))
    ).map((id) => sortedList.find((tenant) => tenant.OrganizationId === id))
      .filter((tenant): tenant is Tenant => tenant !== undefined); // Ensure valid tenants
  
    // Correctly slice the tenant list based on the toggle state
    this.sortedTenants = this.showAllTenants
      ? uniqueTenants // Show all tenants
      : uniqueTenants.slice(0, 12); // Show only the first 12 tenants
  
    console.log('Updated Tenants:', this.sortedTenants);
  }
  
  
  
  
  
  
  toggleOrgSelect(org: any): void {
    org.Selected = !org.Selected; 
  }
  toggleOrgList(): void {
    this.showAllOrgs = !this.showAllOrgs;
    this.updateSortedOrgs(); 
  }
  getResult(): void {
    this.spinner.show();
    console.log('Filtering with values:', this.filterValues);
  
    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        // Filter results to include only cards with complete data
        this.KayakResult = data.json[0];
        this.KayakResult.Result = this.KayakResult.Result.filter((result: any) => {
          return (
            result.MainImage &&
            result.CenterName &&
            result.CenterAddress &&
            result.CenterCity &&
            result.CenterState
          );
        });
  
        // Update tenant selection
        const selectedTenantIds = this.filterValues.tenants.split(',');
        this.sortedTenants.forEach((tenant) => {
          tenant.Selected = selectedTenantIds.includes(String(tenant.OrganizationId));
        });
  
        console.log('Filtered Result:', this.KayakResult);
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching filtered results:', error);
        this.spinner.hide();
      },
    });
  }
  
  

 GetFilters(): void {
  this.spinner.show();
  const body: any = {
    Name: 'GetFilters',
    Params: {
      ids: this.Ids,
    },
  };

  this.PlacesService.GenericAPI(body).subscribe({
    next: (data: any) => {
      if (data && data.json && data.json.length > 0) {
        this.Filters = data.json[0];
        console.log('Filters loaded:', this.Filters); // Debugging

        this.updateSortedTenants(); // Populate tenants
        this.updateSortedOrgs(); // Populate management organizations
      } else {
        console.error('Filters data is empty or undefined.');
      }
      this.spinner.hide();
    },
    error: (error) => {
      console.error('Error fetching filters:', error);
      this.spinner.hide();
    },
  });
}


  updateSortedOrgs(): void {
    if (!this.Filters?.ManagementOrganization || this.Filters.ManagementOrganization.length === 0) {
      console.error('ManagementOrganization list is empty or undefined.');
      this.sortedOrgs = []; // Clear the array if no data
      return;
    }
  
    // Sort organizations alphabetically by Name
    const sortedList = [...this.Filters.ManagementOrganization].sort((a, b) => {
      const nameA = a.Name || '';
      const nameB = b.Name || '';
      return nameA.localeCompare(nameB);
    });
  
    // Deduplicate organizations by a unique combination of OrganizationId and Name
    const uniqueOrgs = Array.from(
      new Set(
        sortedList.map((org) => `${org.OrganizationId}-${org.Name}`)
      )
    ).map((uniqueKey) =>
      sortedList.find(
        (org) => `${org.OrganizationId}-${org.Name}` === uniqueKey
      )
    );
  
    // Ensure no undefined values
    const deduplicatedOrgs = uniqueOrgs.filter(
      (org): org is ManagementOrganization => org !== undefined
    );
  
    // Show all or limited organizations based on the current state
    this.sortedOrgs = this.showAllOrgs
      ? deduplicatedOrgs // Show all organizations
      : deduplicatedOrgs.slice(0, 10);
  
    console.log('Unique and Sorted Organizations:', this.sortedOrgs);
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
    this.updateCitiesForSelectedState();
    this.getResult(); // Automatically call the API on state change
  }

  onCityChange(): void {
    this.getResult(); // Automatically call the API on city change
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
  
    // Split, trim, and remove empty entries
    let tenantIds = currentTenants
      .split(',')
      .map((id: any) => id.trim())
      .filter((id: any) => id !== '');
  
    const orgIdAsString = String(tenant.OrganizationId);
  
    if (tenant.Selected) {
      // Add the ID if not already present
      if (!tenantIds.includes(orgIdAsString)) {
        tenantIds.push(orgIdAsString);
      }
    } else {
      // Remove the ID
      tenantIds = tenantIds.filter((id: any) => id !== orgIdAsString);
    }
  
    // Update filterValues.tenants
    this.filterValues.tenants = tenantIds.join(',');
  
    // Update tenant.Selected status in sortedTenants
    this.sortedTenants.forEach((t) => {
      t.Selected = tenantIds.includes(String(t.OrganizationId));
    });
  
    console.log('Updated Tenants Filter:', this.filterValues.tenants);
  
    // Trigger filtering API
    this.getResult();
  }
  
  

  toggleOrgSelection(org: ManagementOrganization): void {
    const currentOrgs = this.filterValues.managementOrganizationIds || '';
  
    // Split, trim, and remove empty entries
    let orgIds = currentOrgs
      .split(',')
      .map((id: any) => id.trim())
      .filter((id: any) => id !== '');
  
    const orgIdAsString = String(org.OrganizationId);
  
    if (org.Selected) {
      // Add the ID if not already present
      if (!orgIds.includes(orgIdAsString)) {
        orgIds.push(orgIdAsString);
      }
    } else {
      // Remove the ID
      orgIds = orgIds.filter((id: any) => id !== orgIdAsString);
    }
  
    this.filterValues.managementOrganizationIds = orgIds.join(',');
    console.log('Updated Management Organization Filter:', this.filterValues.managementOrganizationIds);
  
    // Trigger filtering API
    this.getResult();
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
        this.Ids = data.json[0].Ids;

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
      this.tags[modalTagIndex].isSelected = false; // Ensure sync with modal
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
      this.isDropdownOpenIndex = null; // Close the dropdown if clicked outside
    }
  }
  toggleSeeMore(): void {
    this.showMorePlaces = !this.showMorePlaces;
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
  

}
