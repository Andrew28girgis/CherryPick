import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PropertiesServiceService } from '../../../services/properties-service.service';
import { PlacesService } from '../../../services/places.service';
import { MapsService } from '../../../services/maps.service';
import { GoogleMap, GoogleMapsMarker, GoogleMapsBounds } from '../../../../models/google-maps.types';

// Add this declaration
declare const google: any;

interface Property {
  id: number;
  title: string;
  address: string;
  image: string;
  isFavorite: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metrics: {
    nearestCompetitor: string;
    nearestCompTenant: string;
    purchasePrice: string;
    availableUnits: number;
    unitSizes: string;
  };
  broker: {
    name: string;
    logo: string;
  };
}

interface FilterTag {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent {
  searchControl = new FormControl('');
  selectedCountry:string = 'USA';
  selectedCity = 'New York';
  selectedArea = 'Albany/Buffalo/Syracuse';
  viewMode: 'grid' | 'list' | 'compact' = 'grid';
  currentView: 'dashboard' | 'split' | 'list' | 'grid' = 'dashboard';

  isLoading = false;
  sidebarCollapsed: boolean = false;

  filterTags: FilterTag[] = [
    { id: 'shopping', icon: 'shopping-cart', label: 'Shopping Centers', active: true },
    { id: 'tenants', icon: 'store', label: 'Complementary Tenants', active: true },
    { id: 'competitors', icon: 'chart-bar', label: 'Competitors', active: true },
    { id: 'demographics', icon: 'users', label: 'Demographics', active: true }
  ];

  properties: Property[] = [
    {
      id: 1,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 3,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    },
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      isFavorite: false,
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF'
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg'
      }
    }
  ];
list: any;

  // Add new properties for map handling
  private map: any = null;
  private markers: GoogleMapsMarker[] = [];
  private bounds: any = null;

  constructor(
    private propertiesService: PropertiesServiceService,
    private placesService: PlacesService,
    private mapsService: MapsService,
    private router: Router
  ) {
    this.setupSearchListener();
  }

  ngOnInit() {
    const buyboxId = this.propertiesService.getbuyboxId();
    this.loadProperties(buyboxId);
  }

  private async loadProperties(buyboxId: number) {
    this.isLoading = true;
    try {
      const response = await this.placesService.GetBuyBoxPlaces(buyboxId).toPromise();
      this.propertiesService.setGroupedPropertiesArray(response);
      this.properties = this.transformProperties(response);
      
      // Initialize map after properties are loaded
      if (this.currentView === 'split') {
        this.initializeMap();
      }
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading properties:', error);
      this.isLoading = false;
    }
  }

  private transformProperties(apiResponse: any[]): Property[] {
    // Transform API response to match Property interface
    return apiResponse.map(item => ({
      id: item.Id,
      title: item.Name,
      address: item.Address,
      image: item.Image,
      isFavorite: false,
      metrics: {
        nearestCompetitor: this.formatDistance(item.NearestCompetitorDistance),
        nearestCompTenant: this.formatDistance(item.NearestTenantDistance),
        purchasePrice: this.formatPrice(item.Price),
        availableUnits: item.AvailableUnits,
        unitSizes: this.formatUnitSizes(item.UnitSizes)
      },
      broker: {
        name: item.Broker?.Name || '',
        logo: item.Broker?.Logo || ''
      }
    }));
  }

  private formatDistance(distance: number): string {
    return distance ? `${distance.toFixed(2)} Mi` : 'N/A';
  }

  private formatPrice(price: number): string {
    return price ? `$${price.toLocaleString()}` : 'N/A';
  }

  private formatUnitSizes(sizes: any): string {
    return sizes ? `${sizes.min} SF-${sizes.max} SF` : 'N/A';
  }

  private initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const mapConfig = this.mapsService.getDefaultMapConfig();
    this.map = this.mapsService.createMap(mapElement, mapConfig);
    this.bounds = new google.maps.LatLngBounds();

    this.clearMarkers();

    this.properties.forEach(property => {
      if (property.coordinates) {
        const marker = this.mapsService.addPropertyMarker(
          this.map,
          {
            lat: property.coordinates.latitude,
            lng: property.coordinates.longitude
          },
          property
        ) as GoogleMapsMarker & { addListener: (event: string, handler: () => void) => void };
        
        this.markers.push(marker);
        this.bounds!.extend(marker.getPosition()!);

        // Add click listener to marker
        marker.addListener('click', () => {
          this.onMarkerClick(property);
        });
      }
    });

    if (this.markers.length > 0) {
      this.map.fitBounds(this.bounds);
    }
  }

  private clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  private onMarkerClick(property: Property) {
    // Handle marker click - e.g., show property details
    console.log('Property clicked:', property);
    // Implement your marker click handling logic here
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchProperties(value || '');
    });
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
  searchProperties(query: string): void {
    this.properties = this.properties.filter(property =>
      property.title.toLowerCase().includes(query.toLowerCase()) ||
      property.address.toLowerCase().includes(query.toLowerCase())
    );
  }

  toggleFilterTag(tag: FilterTag): void {
    tag.active = !tag.active;
    this.applyFilters();
  }

  private applyFilters(): void {
    // Implement filter logic
  }

  setViewMode(mode: 'grid' | 'list' | 'compact'): void {
    this.viewMode = mode;
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    // Save sidebar state
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  toggleFavorite(property: Property): void {
    property.isFavorite = !property.isFavorite;
  }

  removeFilter(tagToRemove: any): void {
    this.filterTags = this.filterTags.filter(tag => tag.id !== tagToRemove.id);
  }
  
  setView(view: 'dashboard' | 'split' | 'list' | 'grid'): void {
    this.currentView = view;
    
    // Initialize map when switching to split view
    if (view === 'split') {
      setTimeout(() => {
        this.initializeMap();
      }, 100); // Small delay to ensure DOM is ready
    }
  }
}

