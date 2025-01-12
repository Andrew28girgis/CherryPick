import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PropertyView } from '../../../../../shared/enums/property-view.enum';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-propertiesgridview-component',
  templateUrl: './propertiesgridview-component.component.html',
  styleUrls: ['./propertiesgridview-component.component.css']
})
export class PropertiesgridviewComponentComponent {
  @Input() properties!: any[];
  currentView: PropertyView = PropertyView.DEFAULT;
  PropertyView = PropertyView;
  filteredProperties: any[] = [];
  sidebarCollapsed = false;
  searchControl = new FormControl('');
  selectedCountry = 'USA';
  selectedCity = 'New York';
  selectedArea = 'Manhattan';
  filterTags: any[] = [];

  onSidebarCollapse(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  removeFilter(tag: any) {
    this.filterTags = this.filterTags.filter(t => t !== tag);
  }

  toggleFilterTag(tag: any) {
    tag.active = !tag.active;
  }
  switchView(view: PropertyView) {
    this.currentView = view;
  }
}