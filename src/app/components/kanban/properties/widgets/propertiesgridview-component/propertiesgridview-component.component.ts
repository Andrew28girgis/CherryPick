import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PropertyView } from '../../../../../shared/enums/property-view.enum';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

interface Property {
  name: string;
  address: string;
  unitSize: string;
  leasePrice: string;
  competitorDistance: string;
}

@Component({
  selector: 'app-propertiesgridview-component',
  templateUrl: './propertiesgridview-component.component.html',
  styleUrls: ['./propertiesgridview-component.component.css']
})
export class PropertiesgridviewComponentComponent implements OnInit {
  @Input() properties!: Property[];
  currentView: PropertyView = PropertyView.DEFAULT;
  PropertyView = PropertyView;
  filteredProperties: any[] = [
    {
      name: 'Prospect Target Fairfax',
      address: '9607 Fairfax Blvd, Fairfax, VA',
      unitSize: '1,214 SF-1,568 SF',
      leasePrice: '13,450-$15,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '1.59-2.12 Mi'
      }
    },
    {
      name: 'Washington Square Plaza',
      address: '1234 Washington St, Arlington, VA',
      unitSize: '2,000 SF-2,500 SF',
      leasePrice: '18,000-$22,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '0.8-1.2 Mi'
      }
    },
    {
      name: 'Alexandria Commons',
      address: '567 Duke St, Alexandria, VA',
      unitSize: '800 SF-1,200 SF',
      leasePrice: '10,000-$12,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '2.0-2.5 Mi'
      }
    },{
      name: 'Prospect Target Fairfax',
      address: '9607 Fairfax Blvd, Fairfax, VA',
      unitSize: '1,214 SF-1,568 SF',
      leasePrice: '$3,450-$15,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '1.59-2.12 Mi'
      }
    },
    {
      name: 'Washington Square Plaza',
      address: '1234 Washington St, Arlington, VA',
      unitSize: '2,000 SF-2,500 SF',
      leasePrice: '18,000-$22,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '0.8-1.2 Mi'
      }
    },
    {
      name: 'Alexandria Commons',
      address: '567 Duke St, Alexandria, VA',
      unitSize: '800 SF-1,200 SF',
      leasePrice: '10,000-$12,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '2.0-2.5 Mi'
      }
    },{
      name: 'Prospect Target Fairfax',
      address: '9607 Fairfax Blvd, Fairfax, VA',
      unitSize: '1,214 SF-1,568 SF',
      leasePrice: '13,450-$15,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '1.59-2.12 Mi'
      }
    },
    {
      name: 'Washington Square Plaza',
      address: '1234 Washington St, Arlington, VA',
      unitSize: '2,000 SF-2,500 SF',
      leasePrice: '18,000-$22,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '0.8-1.2 Mi'
      }
    },
    {
      name: 'Alexandria Commons',
      address: '567 Duke St, Alexandria, VA',
      unitSize: '800 SF-1,200 SF',
      leasePrice: '10,000-$12,000',
      nearestCompetitors: {
        logo: 'assets/Images/klnb-logo.jpg',
        distance: '2.0-2.5 Mi'
      }
    }
  ];
  sidebarCollapsed = false;
  searchControl = new FormControl('');
  selectedCountry = 'USA';
  selectedCity = 'New York';
  selectedArea = 'Manhattan';
  filterTags: any[] = [
    { id: 'shopping', label: 'Shopping Centers', active: true },
    { id: 'tenants', label: 'Complementary Tenants', active: true },
    { id: 'competitors', label: 'Competitors', active: true },
    { id: 'demographics', label: 'Demographics', active: true }
  ];

  // Store the original properties list
  private originalProperties: any[] = [];

  ngOnInit() {
    // Store the original properties when component initializes
    this.originalProperties = [...this.filteredProperties];

    // Set up search subscription
    this.searchControl.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms pause in events
      distinctUntilChanged() // Only emit when the current value is different from the last
    ).subscribe(searchTerm => {
      this.searchProperties(searchTerm);
    });
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  searchProperties(searchTerm: string | null) {
    if (!searchTerm) {
      this.filteredProperties = [...this.originalProperties];
      return;
    }

    searchTerm = searchTerm.toLowerCase().trim();
    this.filteredProperties = this.originalProperties.filter(property => {
      return (
        property.name.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.unitSize.toLowerCase().includes(searchTerm) ||
        property.leasePrice.toLowerCase().includes(searchTerm) ||
        property.nearestCompetitors.distance.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Add location filter method
  filterByLocation() {
    let filtered = [...this.originalProperties];

    // Apply country filter
    if (this.selectedCountry) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(this.selectedCountry.toLowerCase())
      );
    }

    // Apply city filter
    if (this.selectedCity) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(this.selectedCity.toLowerCase())
      );
    }

    // Apply area filter
    if (this.selectedArea) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(this.selectedArea.toLowerCase())
      );
    }

    this.filteredProperties = filtered;
  }

  // Update the existing location selection methods
  onCountryChange() {
    this.filterByLocation();
  }

  onCityChange() {
    this.filterByLocation();
  }

  onAreaChange() {
    this.filterByLocation();
  }

  onSidebarCollapse(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));

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