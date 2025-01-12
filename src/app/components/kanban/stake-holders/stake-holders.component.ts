import { Component, OnInit, ViewChild } from '@angular/core';
import { table } from '../../../../models/kanbans';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-details',
  templateUrl: './stake-holders.component.html', 
  styleUrls: ['./stake-holders.component.css'],
})
export class StakeHolderComponent implements OnInit {
  @ViewChild(FilterPanelComponent) filterPanel!: FilterPanelComponent;
  searchText: string = '';
  selectedRows: Set<number> = new Set();
  showFilter: boolean = false;
  editingRow: table | null = null;
  showFilterSidebar: boolean = false;
  activeFilter: string = 'Prospect';
  activeTab: string = 'Team';
  sidebarCollapsed: boolean = false;
  isLoading = false;

  data: table[] = [];
  filteredData: table[] = [];

  // Add static data
  private staticData: table[] = [
    {
      id: 1,
      leadBroker: {
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        lastSeen: '2024-03-20T10:30:00'
      },
    },
    {
      id: 2,
      leadBroker: {
        name: 'Jane Smith',
        avatar: 'https://i.pravatar.cc/150?img=2',
        email: 'jane.smith@example.com',
        phone: '(555) 234-5678',
        lastSeen: '2024-03-20T09:15:00'
      },
    },
    {
      id: 3,
      leadBroker: {
        name: 'Michael Johnson',
        avatar: 'https://i.pravatar.cc/150?img=3',
        email: 'michael.j@example.com',
        phone: '(555) 345-6789',
        lastSeen: '2024-03-19T16:45:00'
      },
    },
    {
      id: 4,
      leadBroker: {
        name: 'Sarah Williams',
        avatar: 'https://i.pravatar.cc/150?img=4',
        email: 'sarah.w@example.com',
        phone: '(555) 456-7890',
        lastSeen: '2024-03-20T08:00:00'
      },
    }
  ];

  constructor(
    private router: Router
  ) {}

  private loadStakeholders(): void {
    this.isLoading = true;
    // Replace HTTP call with static data
    this.data = this.staticData;
    this.filteredData = this.staticData;
    this.isLoading = false;
  }

  ngOnInit(): void {
    this.loadStakeholders();
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  onSearchChange(event: any): void {
    this.searchText = event.target.value;
    this.filterData();
  }

  filterData(): void {
    if (!this.searchText) {
      this.filteredData = this.data;
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredData = this.data.filter((row) => 
      row.leadBroker.name.toLowerCase().includes(searchLower) ||
      row.leadBroker.email.toLowerCase().includes(searchLower) ||
      row.leadBroker.phone.toLowerCase().includes(searchLower)
    );
  }

  isRowSelected(row: table): boolean {
    return this.selectedRows.has(row.id);
  }

  toggleRow(row: table): void {
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

  onEdit(row: table): void {
    this.editingRow = { ...row };
  }

  onSaveEdit(updatedRow: table): void {
    // Replace HTTP call with direct array update
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

  onDelete(row: table): void {
    // Replace HTTP call with direct array filter
    this.data = this.data.filter(item => item.id !== row.id);
    this.filteredData = this.filteredData.filter(item => item.id !== row.id);
  }

  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
  }

  onSearchIconClick(): void {
    this.filterData();
  }

  toggleFilterSidebar(): void {
    this.showFilterSidebar = !this.showFilterSidebar;
  }

  toggleFilter() {
    this.filterPanel.toggle();
  }

  onFilterChange(filters: any) {
    // Replace HTTP call with local filtering
    this.data = this.staticData.filter(item => {
      // Add your filter logic here based on the filters parameter
      return true; // Replace with actual filtering conditions
    });
    this.filteredData = this.data;
  }

  isRouteActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }
}
