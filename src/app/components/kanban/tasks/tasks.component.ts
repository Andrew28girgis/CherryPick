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
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 2,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    // Additional sample data matching the image
    {
      id: 3,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Today',
        priority: 'Low',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 4,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Upcoming',
        priority: 'High',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 1,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 2,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    // Additional sample data matching the image
    {
      id: 3,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Today',
        priority: 'Low',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 4,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Upcoming',
        priority: 'High',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 1,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 2,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Overdue',
        priority: 'Medium',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    // Additional sample data matching the image
    {
      id: 3,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Not Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Today',
        priority: 'Low',
        notes: 'Client very interested in location; highlighted key amenities.',
      },
    },
    {
      id: 4,
      leadBroker: {
        task: 'Schedule initial consultations to understand client needs. ',
        status: 'Started',
        project: 'Nike',
        projectImg: 'assets/Images/Avatars/Mark.svg',
        asignee: 'Hassan Magdy',
        asigneeImg: 'assets/Images/Avatars/Mark.svg',
        due: 'Upcoming',
        priority: 'High',
        notes: 'Client very interested in location; highlighted key amenities.',
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
        row.leadBroker.task.toLowerCase().includes(searchLower) ||
        row.leadBroker.task.toLowerCase().includes(searchLower) ||
        row.leadBroker.task.toLowerCase().includes(searchLower)
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
}
