import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Contact,
  OrganizationWithContacts,
} from 'src/app/shared/models/contacts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css'],
})
export class ContactsComponent implements OnInit {
  // Add Math property
  Math = Math;

  searchTerm: string = '';
  showAddForm: boolean = false;
  organizations: any[] = [];

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  // Store both full and filtered lists
  contacts: Contact[] = [];
  filteredContacts: OrganizationWithContacts[] = [];
  paginatedContacts: OrganizationWithContacts[] = [];
  isLoading: boolean = true;

  // Form data for new contact
  newContact: any = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    organizationId: '',
    guidSignature: null,
  };

  // Filter and sort options
  selectedCompany: string = 'all';
  companies: string[] = ['all', 'RENAUD CONSULTING'];

  // Filter properties
  shareFilter: 'all' | 'shared' | 'not-shared' = 'all';
  priceFrom: string = '';
  priceTo: string = '';
  sizeFrom: string = '';
  sizeTo: string = '';

  // Sort properties
  sortBy: string = 'newest';
  sortOptions = [
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'newest', label: 'Newest to Oldest' },
    { value: 'oldest', label: 'Oldest to Newest' },
    { value: 'status', label: 'Status' },
  ];
  // Tracks which organizations are expanded
  expandedOrgs: { [orgId: number]: boolean } = {};

  constructor(private http: HttpClient, private PlacesService: PlacesService) {
    this.loadContacts();
    this.loadOrganizations();
  }

  private loadContacts() {
    this.isLoading = true;
    const params = { Name: 'GetAllcontacts', Params: {} };

    this.PlacesService.GenericAPI(params).subscribe(
      (data: any) => {
        if (data?.json) {
          this.contacts = data.json;
        }
        this.isLoading = false;
        this.applyFiltersAndSort(); // 👈 only works if orgs already loaded
      },
      () => (this.isLoading = false)
    );
  }

  private loadOrganizations() {
    const params = { Name: 'RetrieveOrganizations', Params: {} };

    this.PlacesService.GenericAPI(params).subscribe((data: any) => {
      if (data?.json) {
        this.organizations = data.json;
      }
      this.applyFiltersAndSort(); // 👈 ensures filter runs once orgs exist
    });
  }

  ngOnInit(): void {
    this.applyFiltersAndSort();
  }

  toggleExpand(orgId: number): void {
    this.expandedOrgs[orgId] = !this.expandedOrgs[orgId];
  }

  onSearch(): void {
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let orgs = [...this.organizations];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      orgs = orgs.filter((org) =>
        (org.name || '').toLowerCase().includes(searchLower)
      );
    }

    // Sort organizations
    orgs.sort((a, b) => {
      switch (this.sortBy) {
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        default:
          return 0;
      }
    });

    // Group contacts under each organization
    this.filteredContacts = orgs.map((org) => ({
      ...org,
      contacts: this.contacts.filter((c) => c.organizationId === org.id),
    }));
    this.totalItems = this.filteredContacts.length;
    this.updatePage(1);
  }

  updatePage(page: number): void {
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedContacts = this.filteredContacts.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.updatePage(page);
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(): void {
    // Convert pageSize to number since it comes from select as string
    this.pageSize = Number(this.pageSize);
    // Reset to first page when changing page size
    this.currentPage = 1;
    // Update pagination
    this.updatePage(1);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const maxPages = 5; // Show maximum 5 page numbers

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  onAddNew(): void {
    this.showAddForm = true;
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  closeAddForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newContact = {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      organizationId: '',
      guidSignature: null,
    };
  }

  saveContact(): void {
    if (
      this.newContact.firstname &&
      this.newContact.email &&
      this.newContact.organizationId
    ) {
      const params = {
        name: 'CreateContact',
        mainEntity: null,
        params: {
          Firstname: this.newContact.firstname,
          LastName: this.newContact.lastname,
          OrganizationId: this.newContact.organizationId,
          Email: this.newContact.email,
          Password: this.newContact.password,
          GUIDSignature: '',
        },
        json: null,
      };

      this.PlacesService.GenericAPI(params).subscribe(
        (response: any) => {
          console.log('Contact created:', response);
          if (response.error) {
            console.error('Error from API:', response.error);
          } else {
            this.loadContacts();
            this.closeAddForm();
          }
        },
        (error) => {
          console.error('Error creating contact:', error);
        }
      );
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeAddForm();
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newContact.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }
}
