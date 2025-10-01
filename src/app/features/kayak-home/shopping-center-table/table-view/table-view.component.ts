import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  Input,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Center, Stage } from '../../../../shared/models/shoppingCenters';
import { General } from 'src/app/shared/models/domain';
import { Subscription, combineLatest } from 'rxjs';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ContactBrokerComponent } from '../contact-broker/contact-broker.component';
import { PlacesService } from 'src/app/core/services/places.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AddContactComponent } from '../add-contact/add-contact.component';
@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
})
export class TableViewComponent implements OnInit, OnDestroy {
  // Properties
  General: General = new General();
  campaignid!: any;
  OrgId!: any;
  showShoppingCenters = true;
  shoppingCenters: Center[] = [];
  filteredCenters: Center[] = [];
  selectedId: number | null = null;
  placesRepresentative: boolean | undefined;
  StreetViewOnePlace!: boolean;
  sanitizedUrl!: any;
  mapViewOnePlacex = false;
  selectedIdCard: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;
  selectedStageName = 'All';
  stages: Stage[] = [];
  selectedStageId = 0; // Default to 0 (All)
  allShoppingCenters: Center[] = []; // Store all shopping centers

  // Loading state for skeleton
  isLoading = true;
  isLoadingstatus = true;
  dataReady = false;
  // Kanban stages
  KanbanStages: any[] = [];
  activeDropdown: any = null;

  @ViewChild('statusModal', { static: true }) statusModal!: TemplateRef<any>;
  htmlContent!: SafeHtml;
  private modalRef?: NgbModalRef;

  private subscriptions = new Subscription();
  private outsideClickHandler: ((e: Event) => void) | null = null;
  submissions: any;
  @ViewChild('submission', { static: true }) submissionModal!: TemplateRef<any>;
  Campaign: any;
  CampaignId!: any;

  orgId!: any;
  cId!: number;
  orgName!: string;
  openOrgMenuId: number | null = null;
  orgMenuPos: { top?: string; left?: string } = {};
  activeDropdownId: number | null = null;
  public showStageColumn = false;
  isUpdatingStage = false;
  @ViewChildren('dropdownRef') dropdowns!: QueryList<ElementRef>;
  infoData: any = null;
  isLoadingInfo = false;
  openMenuId: number | null = null;
  openStageId: number | null = null;
  rotatingKeys: { [id: number]: number } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer,
    private viewManagerService: ViewManagerService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.subscriptions.add(
      this.viewManagerService.loadingComplete$.subscribe((done) => {
        this.isLoading = !done; // show loader until both flags are satisfied
        this.dataReady = done;
        this.cdr.markForCheck();
      })
    );
    this.loadStages();

    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id;
        // Update the selected stage name for display
        if (id === 0) {
          this.selectedStageName = 'All';
        } else {
          const stage = this.stages.find((s) => s.id === id);
          this.selectedStageName = stage ? stage.stageName : '';
        }
        this.cdr.detectChanges();
      })
    );

    this.activatedRoute.params.subscribe((params: any) => {
      this.orgId = params.orgId;
      this.Campaign = params.campaign;
      this.cId = params.campaignId;
      this.orgName = params.orgName;

      localStorage.setItem('OrgId', this.OrgId);
    });

    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers;
        this.cdr.detectChanges();
      })
    );
    this.subscriptions.add(
      this.shoppingCenterService.allShoppingCenters$.subscribe((centers) => {
        this.allShoppingCenters = centers;
        this.cdr.detectChanges();
      })
    );
    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.kanbanStages$.subscribe((stages) => {
        this.KanbanStages = stages;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // Remove any document event listeners
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }

  // filterCenters() {
  //   this.shoppingCenterService.filterCenters(this.searchQuery)
  // }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: any
  ) {
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    await this.shoppingCenterService.initializeMap('mappopup', lat, lng);
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    // Store the modal object
    this.General.modalObject = modalObject;

    // Initialize street view after modal is opened
    modalRef.result.then(
      () => {
        // Cleanup if needed
      },
      () => {
        // Cleanup if needed
      }
    );

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this.viewOnStreet();
    }, 100);
  }

  viewOnStreet() {
    if (!this.General.modalObject) return;

    const lat = parseFloat(this.General.modalObject.Latitude);
    const lng = parseFloat(this.General.modalObject.Longitude);

    // Default values for heading and pitch if not provided
    const heading = this.General.modalObject.Heading || 165;
    const pitch = this.General.modalObject.Pitch || 0;

    // Initialize street view
    this.viewManagerService.initializeStreetView(
      'street-view',
      lat,
      lng,
      heading,
      pitch
    );
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.shoppingCenterService.sanitizeUrl(url);
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: 'xl',
      centered: true,
      windowClass: 'contact-broker-modal-class',
    });
    modalRef.componentInstance.center = center;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByShoppingCenterId(index: number, shoppingCenter: any): number {
    return shoppingCenter?.Id || shoppingCenter?.id || index;
  }

  trackByPlaceId(index: number, place: any): number {
    return place?.Id || place?.id || index;
  }

  trackByOrganizationId(index: number, org: any): number {
    return org?.ID || org?.Id || org?.id || index;
  }

  trackBySubmissionId(index: number, submission: any): number {
    return submission?.Id || submission?.id || index;
  }

  requestCenterStatus(shoppingCenterId: number, campaignId: any) {
    // Set loading state to true to show the skeleton loader
    this.isLoadingstatus = true;

    // Open the modal immediately
    this.modalRef = this.modalService.open(this.statusModal, {
      size: 'lg',
      scrollable: true,
    });

    // Fetch the actual data
    this.placesService
      .GetSiteCurrentStatus(shoppingCenterId, campaignId)
      .subscribe({
        next: (res: any) => {
          // Update the content with the fetched data
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(res);
          this.isLoadingstatus = false; // Hide the skeleton loader
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: () => {
          // Handle errors and show fallback content
          const errHtml = '<p>Error loading content</p>';
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml);
          this.isLoadingstatus = false; // Hide the skeleton loader
          this.cdr.detectChanges();
        },
      });
  }

  openModalSubmission(
    submissions: any[],
    submissionModal: TemplateRef<any>
  ): void {
    this.submissions = submissions;
    this.modalService.open(submissionModal, { size: 'md', scrollable: true });
  }
  getCircleProgress(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155;
    const totalLength = circumference;
    const gapSize = (5 / 100) * totalLength; // 5% gap size

    // If 100%, return full circle without gaps
    if (percentage === 100) {
      return `${totalLength} 0`;
    }

    // Calculate the length for the green progress
    const progressLength = (percentage / 100) * (totalLength - 2 * gapSize);
    return `${progressLength} ${totalLength}`;
  }

  getCircleProgressBackground(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155;
    const totalLength = circumference;
    const gapSize = (5 / 100) * totalLength; // 5% gap

    // If 100%, don't show background
    if (percentage === 100) {
      return `0 ${totalLength}`;
    }

    // Calculate the remaining percentage
    const remainingPercentage = 100 - percentage;
    const bgLength = (remainingPercentage / 100) * (totalLength - 2 * gapSize);
    const startPosition =
      (percentage / 100) * (totalLength - 2 * gapSize) + gapSize;

    return `0 ${startPosition} ${bgLength} ${totalLength}`;
  }
  checkSubmission(submissions: any[] | undefined): boolean {
    if (!submissions || !Array.isArray(submissions)) {
      return false;
    }

    // Loop through submissions and return true if any submission has a SubmmisionLink
    return submissions.some((submission) => submission.SubmmisionLink !== null);
  }
  loadStages(): void {
    const body = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        // Assuming the API returns { json: Stage[] }
        this.stages = res.json
          .map((s: any) => ({
            id: +s.id,
            stageName: s.stageName,
            stageOrder: +s.stageOrder,
            isQualified: s.isQualified,
            kanbanTemplateId: +s.kanbanTemplateId,
          }))
          .sort((a: Stage, b: Stage) => a.stageOrder - b.stageOrder);

        // Update the selected stage name after loading stages
        if (this.selectedStageId === 0) {
          this.selectedStageName = 'All';
        } else {
          const current = this.stages.find(
            (s) => s.id === this.selectedStageId
          );
          this.selectedStageName = current ? current.stageName : 'Stage';
        }
        this.cdr.detectChanges();
      }
  
    });
  }

  onCheckboxChange(event: Event, placeId: number, campaignId: number): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.AddPlaceToMarketSurvery(campaignId, placeId);
    } else {
      this.AddPlaceToMarketSurvery(campaignId, placeId);
    }
  }

  AddPlaceToMarketSurvery(campaignId: number, placeId: number): void {
    const body: any = {
      Name: 'AddPlaceToMarketSurvery',
      MainEntity: null,
      Params: {
        CampaignID: campaignId,
        PlaceID: placeId,
      },
      Json: null,
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (data) => {},
    });
  }
  openAddContactModal(shoppingCenterId: number): void {
    const modalRef = this.modalService.open(AddContactComponent, {
      size: 'md',
      backdrop: true,
      backdropClass: 'fancy-modal-backdrop',
      keyboard: true,
      windowClass: 'fancy-modal-window',
      centered: true,
    });

    modalRef.componentInstance.shoppingCenterId = shoppingCenterId;

    modalRef.componentInstance.contactCreated.subscribe((response: any) => {
      // You can add any additional logic here, such as refreshing the shopping center contacts
      // this.getShoppingCenterContact(shoppingCenterId);
    });
  }
  get hasAnySizeRange(): boolean {
    return this.filteredCenters?.some((sc) => !!sc.sizeRange);
  }
  toggleOrgMenu(event: MouseEvent, id: number) {
    event.stopPropagation();
    event.preventDefault();
    if (this.openOrgMenuId === id) {
      this.openOrgMenuId = null;
      this.activeDropdownId = null;
    } else {
      this.openOrgMenuId = id;
      this.activeDropdownId = id;
    }

    this.openOrgMenuId = id;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    document.addEventListener('click', this.closeOrgMenu, { once: true });
  }
  closeOrgMenu = () => {
    this.openOrgMenuId = null;
    this.orgMenuPos = {};
  };

  get hasAnyStages(): boolean {
    return this.filteredCenters?.some((sc) => !!sc.stageName);
  }
  selectStage(
    marketSurveyId: number,
    stageId: number,
    shoppingCenter: any,
    event?: MouseEvent
  ): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.isUpdatingStage = true;

    shoppingCenter.isDropdownOpen = false;
    this.activeDropdownId = null;

    this.viewManagerService.updatePlaceKanbanStage(
      marketSurveyId,
      stageId,
      shoppingCenter,
     );

    setTimeout(() => {
      this.isUpdatingStage = false;
      this.cdr.markForCheck();
    }, 100);
  }
  toggleDropdown(place: any, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.isUpdatingStage) {
      return;
    }

    place.isDropdownOpen = !place.isDropdownOpen;
    this.activeDropdownId = place.isDropdownOpen ? place.Id : null;
  }

  getSelectedStageName(stageId: number): string {
    return this.viewManagerService.getSelectedStageName(stageId);
  }
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    let clickedInsideAny = false;
    this.dropdowns.forEach((dropdown) => {
      if (dropdown.nativeElement.contains(target)) {
        clickedInsideAny = true;
      }
    });

    if (!clickedInsideAny) {
      this.closeAllDropdowns();
    }
  }

  private closeAllDropdowns(): void {
    this.shoppingCenters.forEach((sc: any) => (sc.isDropdownOpen = false));
    this.activeDropdownId = null;
  }

  openInfoPopup(shopping: any, content: TemplateRef<any>): void {
    this.isLoadingInfo = true;
    this.infoData = null;

    const body = {
      Name: 'GetScoreRationale',
      Params: { MSSCId: shopping.MarketSurveyId },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.infoData = res.json[0].scoreRationale || null;
        this.isLoadingInfo = false;
        this.modalService.open(content, {
          size: 'md',
          backdrop: true,
          centered: true,
        });
      }
    });
  }

  InsertAutomation(id: any, reload?: any) {
    if (reload) {
      this.rotatingKeys[id] = (this.rotatingKeys[id] || 0) + 1;

      setTimeout(() => {
        this.rotatingKeys[id] = 0;
      }, 1200);
    }

    this.placesService.InsertAutomation(id).subscribe({
      next: () => {
        if (!reload) {
          this.showToast('Automation Started');
        } else {
          this.showToast('Automation is running again');
        }
      },
    });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToastsuccess');
    const toastMessage = document.getElementById('toastMessagesuccess');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    } else {
    }
  }
  toggleMenu(Id: number, event: MouseEvent, stage?: boolean) {
    event.stopPropagation();
    if (!stage) {
      this.openMenuId = this.openMenuId === Id ? null : Id;
    }
    if (stage) {
      this.openStageId = this.openStageId === Id ? null : Id;
    }
  }

  closeMenu() {
    this.openMenuId = null;
    this.openStageId = null;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    if (this.openMenuId !== null || this.openStageId !== null) {
      this.closeMenu();
    }
  }
  deleteCenter(shoppingCenterId: number) {
    const body: any = {
      Name: 'DeleteShoppingCenterFromMSSC',
      Params: {
        CampaignId: this.CampaignId,
        ShoppingCenterId: shoppingCenterId,
      },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: () => {
        this.viewManagerService.loadShoppingCenters(this.CampaignId);
      },
    });
  }
}
