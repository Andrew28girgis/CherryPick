import { Component, OnInit, ViewChild } from '@angular/core';
import { table2 } from '../../../../models/kanbans';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-details',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  @ViewChild(FilterPanelComponent) filterPanel!: FilterPanelComponent;
  searchText: string = '';
  selectedRows: Set<number> = new Set();
  showFilter: boolean = false;
  editingRow: table2 | null = null;
  showFilterSidebar: boolean = false;
  activeFilter: string = 'Prospect';
  activeTab: string = 'Done';
  sidebarCollapsed: boolean = false;
  showAddTaskForm: boolean = false;
  addTaskForm: FormGroup;
  isLoading = false;

  data: table2[] = [
    {
      id: 1,
      leadBroker: {
        task: 'Follow up with clients about property viewings.',
        status: 'Not Started',
        project: 'Adidas',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Today',
        priority: 'High',
        notes: 'Client prefers properties with large backyards.',
      },
    },
    {
      id: 2,
      leadBroker: {
        task: 'Prepare a market analysis report for the client.',
        status: 'In Progress',
        project: 'Reebok',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Upcoming',
        priority: 'Low',
        notes: 'Focus on residential properties in urban areas.',
      },
    },
    {
      id: 3,
      leadBroker: {
        task: 'Coordinate property listings for new clients.',
        status: 'Started',
        project: 'Puma',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Listings need to emphasize modern architecture.',
      },
    },
    {
      id: 4,
      leadBroker: {
        task: 'Arrange site visits for high-priority clients.',
        status: 'Not Started',
        project: 'Under Armour',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Today',
        priority: 'High',
        notes: 'Ensure all visits are scheduled within the next week.',
      },
    },
    {
      id: 5,
      leadBroker: {
        task: 'Draft proposals for commercial property leases.',
        status: 'Started',
        project: 'New Balance',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Upcoming',
        priority: 'Medium',
        notes: 'Highlight long-term leasing benefits to clients.',
      },
    },
    {
      id: 6,
      leadBroker: {
        task: 'Finalize agreements for pending sales.',
        status: 'Started',
        project: 'Converse',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Low',
        notes: 'Ensure all agreements are signed and properly documented.',
      },
    },
  ];

  filteredData: table2[] = this.data;

  constructor(private router: Router, private formBuilder: FormBuilder) {
    this.addTaskForm = this.formBuilder.group({
      task: ['', Validators.required],
      status: ['Not Started', Validators.required],
      project: ['', Validators.required],
      asignee: ['', Validators.required],
      due: ['', Validators.required],
      priority: ['Medium', Validators.required],
      notes: [''],
    });
  }
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
        row.leadBroker.task.toLowerCase().includes(searchLower) ||
        row.leadBroker.status.toLowerCase().includes(searchLower) ||
        row.leadBroker.project.toLowerCase().includes(searchLower) ||
        row.leadBroker.asignee.toLowerCase().includes(searchLower)||
        row.leadBroker.due.toLowerCase().includes(searchLower) ||
        row.leadBroker.priority.toLowerCase().includes(searchLower) ||
        row.leadBroker.notes.toLowerCase().includes(searchLower)
    );
  }

  isRowSelected(row: table2): boolean {
    return this.selectedRows.has(row.id);
  }

  toggleRow(row: table2): void {
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

  onEdit(): void {
    const selectedIds = Array.from(this.selectedRows);
    if (selectedIds.length === 1) {
      this.editingRow =
        this.data.find((row) => row.id === selectedIds[0]) || null;
    } else {
      console.log('Please select only one row to edit');
    }
  }

  onSaveEdit(updatedRow: table2): void {
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

  onDelete(): void {
    const selectedItems = this.data.filter((row) =>
      this.selectedRows.has(row.id)
    );
    console.log('Deleting:', selectedItems);
    this.data = this.data.filter((row) => !this.selectedRows.has(row.id));
    this.filteredData = this.filteredData.filter(
      (row) => !this.selectedRows.has(row.id)
    );
    this.selectedRows.clear();
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
  toggleFilter() {
    this.filterPanel.toggle();
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

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    // Save sidebar state
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  toggleAddTaskForm(): void {
    this.showAddTaskForm = !this.showAddTaskForm;
    if (!this.showAddTaskForm) {
      this.addTaskForm.reset({
        status: 'Not Started',
        priority: 'Medium',
      });
    }
  }

  onAddTask(): void {
    if (this.addTaskForm.valid) {
      const newTask: table2 = {
        id: this.getNextId(),
        leadBroker: {
          ...this.addTaskForm.value,
          projectImg: 'assets/Images/Avatars/Mark.svg',
          asigneeImg: 'assets/Images/Avatars/Mark.svg',
        },
      };
      this.data.unshift(newTask);
      this.filterData();
      this.toggleAddTaskForm();
    }
  }

  getNextId(): number {
    return Math.max(...this.data.map((task) => task.id)) + 1;
  }

  changePriority(row: table2, direction: 'up' | 'down'): void {
    const priorities = ['High' , 'Medium' , 'Low'];
    const currentIndex = priorities.indexOf(row.leadBroker.priority);
    let newIndex;

    if (direction === 'up') {
      newIndex =
        currentIndex < priorities.length - 1 ? currentIndex + 1 : currentIndex;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    }

    row.leadBroker.priority = priorities[newIndex];
  }
  onSearchChange(event: any): void {
    this.searchText = event.target.value;
    this.filterData();
  }
}
