import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { Stage } from 'src/app/shared/models/shoppingCenters';
import { Subscription } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css'],
})
export class ShoppingCenterTableComponent implements OnInit, OnDestroy {
  @ViewChild('mapView') mapView!: MapViewComponent;
  filteredCenters: any[] = [];
  filteredCampaigns?: ICampaign[];
  isMobile = false;
  currentView = 3;
  isSocialView = false;
  isMapView = false;
  BuyBoxId!: any;
  BuyBoxName!: string;
  CampaignId!: any;
  OrgId!: any;
  selectedOption = 5;
  view = false;
  StageId = 0;
  stages: Stage[] = [];
  selectedStageId = 0;
  selectedStageName = 'Filter';
  encodedName = '';
  searchQuery = '';
  isFilterOpen = false;
  isSortOpen = false;
  private subscriptions = new Subscription();

  dropdowmOptions = [
    { id: 1, text: 'Map View', icon: '../../../assets/Images/Icons/map.png' },
    { id: 2, text: 'Side View', icon: '../../../assets/Images/Icons/element-3.png' },
    { id: 3, text: 'Cards View', icon: '../../../assets/Images/Icons/grid-1.png' },
    { id: 4, text: 'Table View', icon: '../../../assets/Images/Icons/grid-4.png' },
    { id: 5, text: 'Social View', icon: '../../../assets/Images/Icons/globe-solid.svg' },
    { id: 6, text: 'Kanban View', icon: '../../../../assets/Images/Icons/Cadence.svg' }
  ];

  sortOptions = [
    { id: 3, text: 'Default', icon: 'fa-solid fa-ban' },
    { id: 1, text: 'Name (A-Z)', icon: 'fa-solid fa-sort-alpha-down' },
    { id: 2, text: 'Name (Z-A)', icon: 'fa-solid fa-sort-alpha-up' }
  ];
  
  selectedSortId: number = 0;
  isSortMenuOpen = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
    
    // Subscribe to filtered centers
    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe(centers => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );
    
    // Set default view to card view (3) if current view is map view (1)
    const savedView = localStorage.getItem('currentViewDashBord');
    if (savedView === '1') {
      this.currentView = 3;
      localStorage.setItem('currentViewDashBord', '3');
    } else {
      this.currentView = Number(savedView || '3');
    }

    this.isSocialView = this.currentView === 5;
    this.isMapView = false; // Always keep map view disabled
    this.selectedOption = this.currentView;
    
    this.checkScreenSize();
    
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      this.encodedName = encodeURIComponent(this.BuyBoxName);
      this.CampaignId = params.campaignId;
      
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);

      if (Number(localStorage.getItem('currentViewDashBord')) !== 1) {
        this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);
      }
    });

    this.shoppingCenterService.setCurrentView(this.currentView);
    this.filterDropdownOptions();

    // Subscribe to search query changes
    this.subscriptions.add(
      this.shoppingCenterService.searchQuery$.subscribe(query => {
        this.searchQuery = query;
        this.cdr.detectChanges();
      })
    );

    // Load stages and set up stage filtering
    this.loadStages();
    
    // Subscribe to stage changes
    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe(id => {
        this.selectedStageId = id;
        this.updateStageName(id);
        this.cdr.detectChanges();
      })
    );
  }

  private updateStageName(id: number): void {
    if (id === 0) {
      this.selectedStageName = "All";
    } else {
      const stage = this.stages.find(s => s.id === id);
      this.selectedStageName = stage ? stage.stageName : "Stage";
    }
  }

  loadStages(): void {
    const body = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 }
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          this.stages = res.json
            .map((s: any) => ({
              id: +s.id,
              stageName: s.stageName,
              stageOrder: +s.stageOrder,
              isQualified: s.isQualified,
              kanbanTemplateId: +s.kanbanTemplateId
            }))
            .sort((a: any, b: any) => a.stageOrder - b.stageOrder);

          this.updateStageName(this.selectedStageId);
          this.cdr.detectChanges();
        }
      },
      error: (error: Error) => {
        console.error('Error loading kanban stages:', error);
      }
    });
  }

  selectStagekan(stageId: number): void {
    this.selectedStageId = stageId;
    if (stageId === 0) {
      this.selectedStageName = 'Filter';
    } else {
      const stage = this.stages.find((s) => s.id === stageId);
      this.selectedStageName = stage ? stage.stageName : 'Filter';
    }
    this.shoppingCenterService.setSelectedStageId(stageId);
  }

  onSearch(event: any): void {
    this.searchQuery = event.target.value;
    this.shoppingCenterService.filterCenters(this.searchQuery);
  }

  selectOption(option: any): void {
    this.selectedOption = option.id;
    this.currentView = option.id;
    this.isSocialView = this.currentView === 5;
    this.isMapView = this.currentView === 1;
    localStorage.setItem('currentViewDashBord', this.currentView.toString());
    this.shoppingCenterService.setCurrentView(this.currentView);
    this.cdr.detectChanges();
  }

  getCurrentViewName(): string {
    const option = this.dropdowmOptions.find(opt => opt.id === this.currentView);
    return option ? option.text : this.dropdowmOptions[0].text;
  }

  getCurrentViewIcon(): string {
    const option = this.dropdowmOptions.find(opt => opt.id === this.currentView);
    return option ? option.icon : this.dropdowmOptions[0].icon;
  }

  onHighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.highlightMarker(place);
    }
  }

  onUnhighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.unhighlightMarker(place);
    }
  }

  onViewChange(viewStatus: number): void {
    this.currentView = viewStatus;
    this.selectedOption = viewStatus;
    this.shoppingCenterService.setCurrentView(this.currentView);
  }

  toggleSort(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  selectSort(sortOption: any): void {
    this.selectedSortId = sortOption.id;
    this.isSortMenuOpen = false;
    this.shoppingCenterService.setSortOption(sortOption.id);
  }

  getSelectedSortIcon(): string {
    // Always show sort icon for initial state
    if (this.selectedSortId === 0) {
      return 'fa-solid fa-sort';
    }
    const option = this.sortOptions.find(opt => opt.id === this.selectedSortId);
    return option?.icon || 'fa-solid fa-sort';
  }

  getSelectedSortText(): string {
    if (this.selectedSortId === 0) {
      return 'Sort';
    }
    const option = this.sortOptions.find(opt => opt.id === this.selectedSortId);
    return option?.text || 'Sort';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const sortButton = document.querySelector('.sort-container');
    const clickedElement = event.target as HTMLElement;
    
    if (sortButton && !sortButton.contains(clickedElement)) {
      this.isSortMenuOpen = false;
    }
  }

  filterDropdownOptions(): void {
    if (window.innerWidth < 768) {
      this.dropdowmOptions = this.dropdowmOptions.filter(
        option => option.id !== 2
      );
    }
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 767;
    this.filterDropdownOptions();
  }

  ngOnDestroy(): void {
    this.shoppingCenterService.resetSelectedStageId();
    this.subscriptions.unsubscribe();
  }

  generateSafeUrl(): string {
    const safeEncodedName = encodeURIComponent(this.BuyBoxName || '');
    return `/market-survey?buyBoxId=${this.BuyBoxId}&orgId=${this.OrgId}&name=${safeEncodedName}&campaignId=${this.CampaignId}`;
  }
}
