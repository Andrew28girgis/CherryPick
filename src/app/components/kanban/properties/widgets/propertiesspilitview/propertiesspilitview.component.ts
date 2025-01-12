import {
  Component,
  OnInit,
  NgZone,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Property {
  id: number;
  title: string;
  address: string;
  image: string;
  location: {
    lat: number;
    lng: number;
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

// Updated interface for filter tags to be more API-friendly
interface FilterTag {
  id: string;
  icon: {
    name: string;
    path: string;
  };
  label: string;
  active: boolean;
  count?: number;
}

@Component({
  selector: 'app-propertiesspilitview',
  templateUrl: './propertiesspilitview.component.html',
  styleUrls: ['./propertiesspilitview.component.css'],
})
export class PropertiesspilitviewComponent implements OnInit {
  searchControl = new FormControl('');
  selectedCountry = 'USA';
  selectedCity = 'New York';
  selectedArea = 'Albany/Buffalo/Syracuse';
  viewMode: 'grid' | 'list' | 'compact' = 'grid';
  isLoading = false;
  sidebarCollapsed = false;
  showMap = true;
  map: any = null;
  markers: any[] = [];

  // Updated filter tags with SVG paths
  filterTags: FilterTag[] = [
    {
      id: 'shopping',
      icon: {
        name: 'shopping-cart',
        path: 'M21 5l-2.5 2.5-3.5-3.5L17.5 2.5 21 5zM3 21v-4.5l10-10 3.5 3.5-10 10H3z',
      },
      label: 'Shopping Centers',
      active: true,
      count: 15,
    },
    {
      id: 'tenants',
      icon: {
        name: 'store',
        path: 'M3 21h18v-2H3v2zM3 3v2h18V3H3zm0 8h18V9H3v2zm0 4h18v-2H3v2z',
      },
      label: 'Complementary Tenants',
      active: true,
      count: 8,
    },
    {
      id: 'competitors',
      icon: {
        name: 'chart-bar',
        path: 'M12 20v-6M6 20V10m12 10V4',
      },
      label: 'Competitors',
      active: true,
      count: 12,
    },
    {
      id: 'demographics',
      icon: {
        name: 'users',
        path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 1112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      },
      label: 'Demographics',
      active: true,
      count: 20,
    },
  ];

  properties: Property[] = [
    {
      id: 1,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      location: {
        lat: 38.8462,
        lng: -77.3064,
      },
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF',
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg',
      },
    },
    // Duplicate property for grid layout
    {
      id: 2,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      location: {
        lat: 38.8462,
        lng: -77.3064,
      },
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF',
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg',
      },
    },
    {
      id: 3,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      location: {
        lat: 38.8462,
        lng: -77.3064,
      },
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF',
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg',
      },
    },
    {
      id: 4,
      title: 'Prospect Target Fairfax Boulevard',
      address: '9607 Fairfax Blvd, Fairfax, Virginia 21...',
      image: 'assets/Images/property-2.jpg',
      location: {
        lat: 38.8462,
        lng: -77.3064,
      },
      metrics: {
        nearestCompetitor: '1.59-2.12 Mi',
        nearestCompTenant: '2.41-3.14 Mi',
        purchasePrice: '13,450$-15000$',
        availableUnits: 5,
        unitSizes: '1,214 SF-1,568 SF',
      },
      broker: {
        name: 'KLNB',
        logo: 'assets/Images/klnb-logo.jpg',
      },
    },
  ];

  @ViewChild('propertiesList') propertiesList!: ElementRef;
  isAtBottom = false;

  constructor(private ngZone: NgZone, private cd: ChangeDetectorRef) {
    this.setupSearchListener();
  }
  private loadProperties(): void {
    this.isLoading = true;
    // Simulate API call
  }
  ngOnInit() {
    console.log(this.sidebarCollapsed);
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
      this.cd.detectChanges();
    }

    this.loadGoogleMapsScript();
    console.log(this.sidebarCollapsed);

    // this.loadFilterTags();
    // this.loadProperties();

    // Load saved sidebar state
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.searchProperties(value || '');
      });
  }

  private loadGoogleMapsScript() {
    if (
      !document.querySelector(
        'script[src^="https://maps.googleapis.com/maps/api/js"]'
      )
    ) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.ngZone.run(() => {
          this.initializeMap();
        });
      };
      document.head.appendChild(script);
    } else {
      this.initializeMap();
    }
  }

  private initializeMap() {
    const mapOptions = {
      center: { lat: 38.8462, lng: -77.3064 },
      zoom: 12,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6B7280' }],
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#E5E7EB' }],
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#F8FAFC' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#E5E7EB' }],
        },
      ],
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    };

    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = new (window as any).google.maps.Map(mapElement, mapOptions);
      this.addMarkers();
    }
  }

  private addMarkers() {
    this.properties.forEach((property) => {
      const marker = new (window as any).google.maps.Marker({
        position: property.location,
        map: this.map,
        title: property.title,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      this.markers.push(marker);

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div class="map-info-window">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:8px;">
            <h3>${property.title}</h3>
            <p>${property.address}</p>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">
              <span style="color:#6B7280;font-size:12px;">Nearest Competitor</span>
              <span style="color:#111827;font-size:14px;font-weight:500;display:block;">${property.metrics.nearestCompetitor}</span>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });
    });
  }

  searchProperties(query: string): void {
    // Implement search logic
  }

  // Add method to handle API loading
  async loadFilterTags() {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real implementation, this would be:
      // const response = await this.httpClient.get<FilterTag[]>('/api/filter-tags');
      // this.filterTags = response;
    } catch (error) {
      console.error('Error loading filter tags:', error);
    }
  }

  // Update toggle method to handle API updates
  async toggleFilterTag(tag: FilterTag) {
    try {
      tag.active = !tag.active;
      // In real implementation, this would be:
      // await this.httpClient.patch(`/api/filter-tags/${tag.id}`, { active: tag.active });
      this.applyFilters();
    } catch (error) {
      // Revert on error
      tag.active = !tag.active;
      console.error('Error updating filter tag:', error);
    }
  }

  private applyFilters(): void {
    // Implement filter logic
  }

  setViewMode(mode: 'grid' | 'list' | 'compact'): void {
    this.viewMode = mode;
  }

  exportData(): void {
    // Implement export logic
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    // Save sidebar state
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }
  onPropertyHover(property: Property) {
    const marker = this.markers.find(
      (m) =>
        m.getPosition().lat() === property.location.lat &&
        m.getPosition().lng() === property.location.lng
    );

    if (marker) {
      marker.setAnimation((window as any).google.maps.Animation.BOUNCE);
    }
  }

  onPropertyLeave(property: Property) {
    const marker = this.markers.find(
      (m) =>
        m.getPosition().lat() === property.location.lat &&
        m.getPosition().lng() === property.location.lng
    );

    if (marker) {
      marker.setAnimation(null);
    }
  }

  updateScrollProgress() {
    const element = this.propertiesList.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

    const progressBar = element.querySelector('.scroll-progress');
    if (progressBar) {
      progressBar.style.height = `${scrollPercentage}%`;
    }
  }

  showScrollArrow = false;
  currentCardIndex = 0;

  scrollToNextCards() {
    const element = this.propertiesList.nativeElement;
    const currentScrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (currentScrollTop + clientHeight >= scrollHeight) {
      // We're at the bottom, scroll to top
      element.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      this.isAtBottom = false;
    } else {
      // Scroll down by the height of two cards
      const cardHeight = element.querySelector('.property-card').offsetHeight;
      const newScrollTop = currentScrollTop + cardHeight * 2;
      element.scrollTo({
        top: newScrollTop,
        behavior: 'smooth',
      });
    }
  }

  onScroll() {
    const element = this.propertiesList?.nativeElement;
    if (element) {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      this.isAtBottom = scrollTop + clientHeight >= scrollHeight;
    }
  }

  updateScrollArrowVisibility() {
    const element = this.propertiesList.nativeElement;
    const cards = element.querySelectorAll('.property-card');
    this.showScrollArrow = this.currentCardIndex < cards.length - 2;
  }
  removeFilter(tagToRemove: any): void {
    this.filterTags = this.filterTags.filter(
      (tag) => tag.id !== tagToRemove.id
    );
  }
}
