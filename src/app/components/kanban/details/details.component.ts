import { Component, OnInit, ViewChild } from '@angular/core';
import { TableRow } from '../../../shared/models/kanbans';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],
})
export class DetailsComponent implements OnInit {
  @ViewChild(FilterPanelComponent) filterPanel!: FilterPanelComponent;
  searchText: string = '';
  selectedRows: Set<number> = new Set();
  showFilter: boolean = false;
  editingRow: TableRow | null = null;
  showFilterSidebar: boolean = false;
  activeFilter: string = 'Prospect';
  activeTab: string = 'Done';
  isLoading = false;

  data: TableRow[] = [
    {
      id: 1,
      client: {
        id: 1,
        name: "Osmow's kentaki florida",
        location: 'Washington, DC',
        companyLogo: 'assets/Images/Logos/Osmos.svg',
      },
      leadBroker: {
        id: 1,
        name: 'Mark Watson',
        avatar: 'assets/Images/Avatars/Mark.svg',
        stakeholderId: 1,
      },
      stakeholder: {
        id: 1,
        name: 'Hassan Magdy',
        phone: '+1 (555) 987-6543',
        avatar: 'assets/Images/Avatars/hassan.svg',
      },
      unit: 'Unit #26711',
      unitImg: 'assets/Images/Picture.svg',
      status: 'Closed',
      date: 'August 21',
      Notes: 'Client very interested in location; highlighted key amenities.',
    },
    {
      id: 2,
      client: {
        id: 2,
        name: 'Chicken Kickers',
        location: 'Washington, DC',
        companyLogo: 'assets/Images/Logos/Osmos.svg',
      },
      leadBroker: {
        id: 2,
        name: 'Andrew Gergis',
        avatar: 'assets/Images/Avatars/hassan.svg',

        stakeholderId: 2,
      },
      stakeholder: {
        id: 2,
        name: 'Magdy Qasem',
        phone: '+1 (555) 987-6543',
        avatar: 'assets/Images/Avatars/hassan.svg',
      },
      unit: 'Unit #26711',
      unitImg: 'assets/Images/Picture.svg',
      status: 'on-hold',
      date: 'August 31',
      Notes:
        'Clarified financing options, client requested follow-up in two days..',
    },
    // Additional sample data matching the image
    {
      id: 3,
      client: {
        id: 3,
        name: "Osmow's",
        location: 'Washington, DC',
        companyLogo: 'assets/Images/Logos/Osmos.svg',
      },
      leadBroker: {
        id: 3,
        name: 'Paula Ashraf',
        avatar: 'assets/Images/Avatars/hassan.svg',

        stakeholderId: 3,
      },
      stakeholder: {
        id: 3,
        name: 'Mina Emad',
        phone: '+1 (555) 987-6543',
        avatar: 'assets/Images/Avatars/hassan.svg',
      },
      unit: 'Unit #26711',
      unitImg: 'assets/Images/Picture.svg',
      status: 'Closed',
      date: 'September 5',
      Notes:
        'Client agreed to a second viewing with family, seemed enthusiastic..',
    },
    {
      id: 4,
      client: {
        id: 4,
        name: 'Buffalo Burger',
        location: 'Washington, DC',
        companyLogo: 'assets/Images/Logos/Osmos.svg',
      },
      leadBroker: {
        id: 4,
        name: 'Hassan Magdy',
        avatar: 'assets/Images/Avatars/hassan.svg',
        stakeholderId: 4,
      },
      stakeholder: {
        id: 4,
        name: 'Skylar White',
        phone: '+1 (555) 987-6543',
        avatar: 'assets/Images/Avatars/hassan.svg',
      },
      unit: 'Unit #26711',
      unitImg: 'assets/Images/Picture.svg',
      status: 'on-hold',
      date: 'September 12',
      Notes: 'Client very interested in location; highlighted key amenities.',
    },
  ];

  filteredData: TableRow[] = this.data;
  sidebarCollapsed: boolean = false;

  constructor(private router: Router) {}
  private loadProperties(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
    }, 0);
  }
  ngOnInit(): void {
    this.loadProperties();
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  filterData(): void {
    if (!this.searchText) {
      this.filteredData = this.data;
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredData = this.data.filter(
      (row) =>
        row.client.name.toLowerCase().includes(searchLower) ||
        row.leadBroker.name.toLowerCase().includes(searchLower) ||
        row.stakeholder?.name?.toLowerCase().includes(searchLower) ||
        row.unit.toLowerCase().includes(searchLower) ||
        row.status.toLowerCase().includes(searchLower) ||
        row.Notes?.toLowerCase().includes(searchLower)
    );
  }

  isRowSelected(row: TableRow): boolean {
    return this.selectedRows.has(row.id);
  }

  toggleRow(row: TableRow): void {
    if (this.selectedRows.has(row.id)) {
      this.selectedRows.delete(row.id);
    } else {
      this.selectedRows.add(row.id);
    }
  }

  isAllSelected(): boolean {
    return (
      this.filteredData.length > 0 &&
      this.selectedRows.size === this.filteredData.length
    );
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selectedRows.clear();
    } else {
      this.filteredData.forEach((row) => this.selectedRows.add(row.id));
    }
  }

  onEdit(row: TableRow): void {
    this.editingRow = { ...row };
  }

  onSaveEdit(updatedRow: TableRow): void {
    const index = this.data.findIndex((row) => row.id === updatedRow.id);
    if (index !== -1) {
      this.data[index] = updatedRow;
      this.filterData();
    }
    this.editingRow = null;
  }

  onCancelEdit(): void {
    this.editingRow = null;
  }

  onDelete(row: TableRow): void {
    const index = this.data.findIndex((item) => item.id === row.id);
    if (index !== -1) {
      this.data.splice(index, 1);
      this.filteredData = this.filteredData.filter(
        (item) => item.id !== row.id
      );
    }
  }

  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
  }

  onSearchIconClick(): void {
    console.log('Search icon clicked!');
    // Add search logic here
  }

  // Add this method to your component
  toggleFilterSidebar(): void {
    this.showFilterSidebar = !this.showFilterSidebar;
  }
  toggleFilter(): void {
    this.filterPanel.toggle(); // Modified toggleFilter method
    this.showFilter = !this.showFilter; // Modified toggleFilter method
  }

  onFilterChange(filters: any) {
    console.log('Filters changed:', filters);
    // Apply the filters to your data here
  }
  isRouteActive(route: string): boolean {
    return this.router.isActive(route, true);
  }
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(
      (row) =>
        row.client.name.toLowerCase().includes(searchTerm) ||
        row.leadBroker.name.toLowerCase().includes(searchTerm) ||
        row.leadBroker.name.toLowerCase().includes(searchTerm) ||
        row.status.toLowerCase().includes(searchTerm) ||
        row.Notes.toLowerCase().includes(searchTerm)
    );
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    // Save sidebar state
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  onSearchChange(event: any): void {
    this.searchText = event.target.value;
    this.filterData();
  }
}
