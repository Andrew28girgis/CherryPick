import { Component, Output, EventEmitter, HostListener, Input } from '@angular/core';

interface Filter {
  id: string;
  label: string;
  checked: boolean;
  type: 'status' | 'project' | 'client';
}

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.css'],
})
export class FilterPanelComponent {
  @Input() sidebarCollapsed: boolean = false;
  @Output() filterChange = new EventEmitter<any>();
  @Output() panelStateChange = new EventEmitter<boolean>();

  isOpen = false;
  clientName: string = '';

  filters: Filter[] = [
    { id: 'atRisk', label: 'At Risk', checked: false, type: 'status' },
    { id: 'offTrack', label: 'Off Track', checked: false, type: 'status' },
    { id: 'qsr', label: 'QSR', checked: false, type: 'project' },
    { id: 'medical', label: 'Medical', checked: false, type: 'project' },
    { id: 'industrial', label: 'Industrial', checked: false, type: 'project' },
    { id: 'retail', label: 'Retail', checked: false, type: 'project' },
    { id: 'osmows', label: "Osmow's", checked: false, type: 'client' },
    { id: 'scooters', label: 'Scooters', checked: false, type: 'client' },
    {
      id: 'buffaloBurger',
      label: 'Buffalo Burger',
      checked: false,
      type: 'client',
    },
  ];

  get selectedFilters(): Filter[] {
    return this.filters.filter((f) => f.checked);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.panelStateChange.emit(this.isOpen);
  }

  clearFilters() {
    this.filters.forEach((filter) => (filter.checked = false));
    this.clientName = '';
    this.emitFilterChange();
  }

  removeFilter(filter: Filter) {
    filter.checked = false;
    this.emitFilterChange();
  }

  emitFilterChange() {
    const filterState = this.filters.reduce((acc, filter) => {
      acc[filter.id] = filter.checked;
      return acc;
    }, {} as Record<string, boolean>);

    this.filterChange.emit({ ...filterState, clientName: this.clientName });
  }

  // Add click handler for overlay
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    // Close panel when clicking overlay
    const overlay = document.querySelector('.overlay');
    if (this.isOpen && overlay && event.target === overlay) {
      this.toggle();
    }
  }

  addClientName() {
    if (this.clientName.trim()) {
      // Add new client at the top
      this.filters.unshift({
        id: 'client1',
        type: 'client',
        label: this.clientName.trim(),
        checked: false,
      });
      this.clientName = ''; // Clear input field
    }
  }
}
