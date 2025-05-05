import { Component, HostListener, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ICampaign } from 'src/app/shared/models/icampaign';

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css'],
})
export class ShoppingCenterTableComponent implements OnInit {
  @ViewChild('mapView') mapView!: MapViewComponent;
  filteredCampaigns?: ICampaign[];
  isMobile = false;
  currentView: number = 5;
  isSocialView: boolean = false;
  BuyBoxId!: any;
  BuyBoxName!: string;
  CampaignId!: any;
  OrgId!: any;
  selectedOption: number = 5;
  view: boolean = false;
   dropdowmOptions: any = [
    {
      text: 'Map',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
    {
      text: 'Side',
      icon: '../../../assets/Images/Icons/element-3.png',
      status: 2,
    },
    {
      text: 'Cards',
      icon: '../../../assets/Images/Icons/grid-1.png',
      status: 3,
    },
    {
      text: 'Table',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    {
      text: 'Social',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
    {
      text: 'Kanban',
      icon: '../../../../assets/Images/Icons/Cadence.svg',
      status: 6,
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private shoppingCenterService: ViewManagerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
    this.isSocialView = this.localStorage.getItem('currentViewDashBord') === '5';
    this.checkScreenSize(); // Check screen size on initialization
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      this.CampaignId = params.campaignId;

      if (Number(localStorage.getItem('currentViewDashBord')) !== 1 ) {
        this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);        
        
      }
    });

    // Get saved view from localStorage or default to social view (5)
    this.currentView = Number(
      localStorage.getItem('currentViewDashBord') || '5'
    );
    this.selectedOption = this.currentView;

    // Set current view in service
    this.shoppingCenterService.setCurrentView(this.currentView);
    this.filterDropdownOptions();
  }

  selectOption(option: any): void {
    this.selectedOption = option.status;
    this.currentView = option.status;
    this.isSocialView= this.localStorage.getItem('currentViewDashBord') === '5';
    this.cdr.detectChanges();
    // Update current view in service
    this.shoppingCenterService.setCurrentView(this.currentView);
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

  onViewChange(viewStatus: any) {
    this.currentView = viewStatus;
    this.selectedOption = viewStatus;

    // Update current view in service
    this.shoppingCenterService.setCurrentView(this.currentView);
  }

  filterDropdownOptions(): void {
    if (window.innerWidth < 768) {
      this.dropdowmOptions = this.dropdowmOptions.filter(
        (option: any) => option.status !== 2
      );
    }
  }

   @HostListener('window:resize', ['$event'])
    onResize() {
      this.checkScreenSize();
    }
  
    checkScreenSize() {
      this.isMobile = window.innerWidth <= 767;
    }
    get localStorage() {
      return localStorage;
    }
     
}
