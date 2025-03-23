import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Organization,
  RetailRelation,
} from 'src/app/shared/models/buyboxShoppingCenter';
PlacesService
@Component({
  selector: 'app-buybox-relatios',
  templateUrl: './buybox-relatios.component.html',
  styleUrls: ['./buybox-relatios.component.css'],
})
export class BuyboxRelatiosComponent {
  buyBoxId!: number | null;
  buybox: any;
  relationOrgId!: number | null;
  // Retail Relations Data
  retailRelations: RetailRelation[] = [];
  selectedRetailRelationId!: number;
  // Organization Search Data
  organizations: Organization[] = [];
  selectedOrganizationId!: number;
  searchOrganizationTerm: string = '';
  highlightedOrganizationIndex: number = -1;
  showOrganizationSuggestions: boolean = false;
  isSearchingOrganization!: boolean;
  // Properties for managing tag search functionality
  isSearchingTag: boolean = false;
  highlightedTagIndex: number = -1;
  showTagSuggestions: boolean = false;
  tags: any[] = [];
  originalTags: any[] = [];
  searchTagTerm: string = '';
  addedTags: any[] = [];
  RelationsOrganizations: any[] = [];
  tagInputTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });

    this.GetBuyBoxInfo();
    this.GetRetailRelations();
  }

  GetBuyBoxInfo() {
    this.spinner.show();
    const body: any = {
      Name: 'GetWizardBuyBoxesById',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buybox = data.json;
        this.spinner.hide(); 
        this.DisplayOrganizationRelations();
      }
    });
  }

  DisplayOrganizationRelations() {
    this.spinner.show();
    let body: any = {
      Name: 'DisplayOrganizationRelations',
      Params: {
        orgId: this.buybox.OrganizationId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe((res) => { 
      if (res && res.json && res.json.length > 0) {
        this.RelationsOrganizations = res.json;
        this.relationOrgId = res.json[0].id;
      } else { 
      }
      this.spinner.hide();
    });
  }

  // Fetch Retail Relations from API
  GetRetailRelations() {
    let body: any = {
      Name: 'GetRetailRelations',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe(
      (res: any) => {
        this.retailRelations = res.json as RetailRelation[];
      } 
    );
  }

  addTag(tag: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!tag || !tag.id) {
      alert('Invalid tag selected. Please try again.');
      return;
    }
    const organizationId = tag.id;

    const payload = {
      RetailRelationCategoryId: this.selectedRetailRelationId,
      RelationOrgId: organizationId,
      MainOrgId: this.buybox.OrganizationId,
    };

    const body: any = {
      Name: 'CreateOrgRelation',
      Params: payload,
    };

    // Call the API to add the organization
    this.PlacesService.GenericAPI(body).subscribe(
      (res: any) => {
        this.addedTags.push(tag);
        this.tags = this.tags.filter((t) => t.id !== tag.id);
        this.showTagSuggestions = this.tags.length > 0;
        this.GetBuyBoxInfo();
      } 
    );
  }

  selectTagFromList(tag: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.selectTag(tag);
  }

  selectTag(tag: any) {
    this.selectedOrganizationId = tag.id || null;
    this.searchTagTerm = tag.name;
    this.tags = [];
    this.showTagSuggestions = false;
    this.highlightedTagIndex = -1; 
  }

  selectOrganizationFromList(organization: Organization) {
    this.selectOrganization(organization);
  }

  // Handle Keyboard Navigation in Organization Suggestions
  handleOrganizationKeydown(event: KeyboardEvent) {
    if (this.showOrganizationSuggestions && this.organizations.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedOrganizationIndex =
          (this.highlightedOrganizationIndex + 1) % this.organizations.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedOrganizationIndex =
          (this.highlightedOrganizationIndex - 1 + this.organizations.length) %
          this.organizations.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (
          this.highlightedOrganizationIndex >= 0 &&
          this.highlightedOrganizationIndex < this.organizations.length
        ) {
          this.selectOrganization(
            this.organizations[this.highlightedOrganizationIndex]
          );
          event.preventDefault();
        }
      }
    }
  }

  // Hide Suggestions on Blur
  handleOrganizationBlur() {
    setTimeout(() => {
      this.showOrganizationSuggestions = false;
      this.highlightedOrganizationIndex = -1;
    }, 100);
  }

  // Select an Organization from the Suggestions
  selectOrganization(organization: Organization) {
    this.selectedOrganizationId = organization.id;
    this.searchOrganizationTerm = organization.name;
    this.organizations = [];
    this.showOrganizationSuggestions = false;
    this.highlightedOrganizationIndex = -1;
  }

  onOrganizationInput(event: any) {
    const val: string = event.target.value;
    this.searchOrganizationTerm = val;

    if (val.length > 2) {
      this.searchOrganization(val);
    } else {
      this.organizations = [];
      this.showOrganizationSuggestions = false;
      this.highlightedOrganizationIndex = -1;
    }
  }

  // Search Organization API Call
  searchOrganization(term: string) {
    this.isSearchingOrganization = true;
    let body: any = {
      Name: 'SearchOrganizationByName',
      Params: {
        Name: term,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe(
      (res: any) => {
        this.organizations = res.json as Organization[];
        this.showOrganizationSuggestions = true;
        this.highlightedOrganizationIndex = -1;
        this.isSearchingOrganization = false;
      } 
    );
  }

  handleTagBlur(event: any) {
    setTimeout(() => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (
        relatedTarget &&
        (relatedTarget.classList.contains('list-group-item') ||
          relatedTarget.closest('.list-group'))
      ) {
        this.showTagSuggestions = true;
      } else {
        this.showTagSuggestions = false;
      }
    }, 200);
  }

  onTagInput(event: any) {
    if (this.tagInputTimeout) {
      clearTimeout(this.tagInputTimeout);
    }

    if (this.searchTagTerm.trim().length > 3) {
      this.tagInputTimeout = setTimeout(() => {
        this.searchOrganizationByTag(this.searchTagTerm);
      }, 500);
    } else {
      this.tags = [];
      this.showTagSuggestions = false;
    }
  }

  searchOrganizationByTag(term: string) {
    this.isSearchingTag = true;

    // Prepare the API body for the search query
    let body: any = {
      Name: 'GetOrganizationByNameTag',
      Params: {
        Tags: term,
        Name: '',
      },
    };

    // Call the API to search
    this.PlacesService.GenericAPI(body).subscribe(
      (res: any) => {
        this.tags = res.json as any[];
        this.tags = this.tags.filter(
          (tag) =>
            !this.RelationsOrganizations.some(
              (relation) => relation.id === tag.id
            )
        );
        this.showTagSuggestions = this.tags.length > 0;
        this.highlightedTagIndex = -1; 
        this.isSearchingTag = false; 
      } 
    );
  }

  handleTagKeydown(event: KeyboardEvent) {
    if (this.showTagSuggestions && this.tags.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedTagIndex =
          (this.highlightedTagIndex + 1) % this.tags.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedTagIndex =
          (this.highlightedTagIndex - 1 + this.tags.length) % this.tags.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (
          this.highlightedTagIndex >= 0 &&
          this.highlightedTagIndex < this.tags.length
        ) {
          this.selectTag(this.tags[this.highlightedTagIndex]);
          event.preventDefault();
        }
      }
    }
  }

  submitOrganizationForm() {
    const payload = {
      RetailRelationCategoryId: this.selectedRetailRelationId,
      RelationOrgId: this.selectedOrganizationId,
      MainOrgId: this.buybox.OrganizationId,
    };

    let body: any = {
      Name: 'CreateOrgRelation',
      Params: payload,
    };

    this.spinner.show();
    this.PlacesService.GenericAPI(body).subscribe(
      (res: any) => {
        this.spinner.hide();
        this.searchTagTerm = '';
        this.searchOrganizationTerm = '';
        this.GetBuyBoxInfo();
      } 
    );
  }

  DeleteOrganizationRelations(id: number) {
    this.spinner.show();
    let body: any = {
      Name: 'DeleteOrganizationRelation',
      Params: {
        mainOrgId: this.buybox.OrganizationId,
        relationOrgId: id,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe((res) => {
      const Index = this.RelationsOrganizations.findIndex(
        (item) => item.id == id
      );
      this.RelationsOrganizations.splice(Index, 1);
      this.spinner.hide();
      alert('Relation deleted successfully!');
    });
  }
}
