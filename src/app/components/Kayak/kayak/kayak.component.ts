import { Organization } from './../../../../models/userKanban';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { KayakResult, StatesAndCities } from 'src/models/kayak';
import {
  FilterValues,
  KayakFilters,
  ManagementOrganization,
  Tenant,
} from 'src/models/filters';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-kayak',
  templateUrl: './kayak.component.html',
  styleUrls: ['./kayak.component.css'],
})
export class KayakComponent implements OnInit {
  Ids!: number[];
  filtered!: any;
  KayakResult!: KayakResult;
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

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.GetStatesAndCities();
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
  }

  getResult(): void {
    console.log(`filter values`);

    console.log(this.filterValues);

    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakResult = data.json[0];
      },
      error: (error) => console.error('Error fetching APIs:', error),
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
        }

        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  GetStatesAndCities(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetStates',
      Params: {},
    };
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
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getCitiesOfState() {
    this.selectedCity = '';
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode == this.filterValues?.statecode
    );
  }

  toggleTenantSelection(tenant: Tenant): void {
    // Safely get the current comma-separated string of IDs
    const currentTenants = this.filterValues.tenants || '';

    // Split on commas, trim spaces, and remove any empty entries
    let tenantIds = currentTenants
      .split(',')
      .map((id: any) => id.trim())
      .filter((id: any) => id !== '');

    // Convert OrganizationId to string to ensure matching works
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

    // Convert back to a comma-separated string
    this.filterValues.tenants = tenantIds.join(',');
    console.log('Tenants:', this.filterValues.tenants);
  }

  toggleOrgSelection() {
    this.filterValues.managementOrganizationIds =
      this.Filters?.ManagementOrganization?.filter(
        (org: ManagementOrganization) => org.Selected
      )
        .map((org: ManagementOrganization) => org.OrganizationId)
        .join(',');
    console.log(
      'ManagementOrganizationIds:',
      this.filterValues.managementOrganizationIds
    );
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
    // Remove the tag from the selectedTags array
    this.selectedTags = this.selectedTags.filter((t) => t.tag !== tag.tag);
    // Update the modal's checkbox state
    const modalTagIndex = this.tags.findIndex((t) => t.tag === tag.tag);
    if (modalTagIndex > -1) {
      this.tags[modalTagIndex].isSelected = false; // Ensure sync with modal
    }
  }
  applyTags(): void {
    const selectedTagsJson = this.selectedTags.map((tag) => ({ tag: tag.tag }));
    console.log('Selected Tags to be sent:', selectedTagsJson);
    this.modalService.dismissAll();
  }
}
