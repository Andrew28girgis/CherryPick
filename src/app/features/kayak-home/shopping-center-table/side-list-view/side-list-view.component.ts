import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import {
  Center,
  SentMails,
  Stage,
} from '../../../../shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { Polygon } from 'src/app/shared/models/polygons';
import { General } from 'src/app/shared/models/domain';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlacesService } from 'src/app/core/services/places.service';
import { MapsService } from 'src/app/core/services/maps.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription } from 'rxjs';
import { ContactBrokerComponent } from '../contact-broker/contact-broker.component';
import { Email } from 'src/app/shared/models/email';
import { AddContactComponent } from '../add-contact/add-contact.component';

declare const google: any;

@Component({
  selector: 'app-side-list-view',
  templateUrl: './side-list-view.component.html',
  styleUrls: ['./side-list-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Added OnPush strategy
})
export class SideListViewComponent implements OnInit, OnDestroy {
  General: General = new General();
  cardsSideList: Center[] = [];
  map: any;
  // BuyBoxId!: any
  orgId!: any;
  mapViewOnePlacex = false;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  shoppingCenter: any;
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  Polygons: Polygon[] = [];
  placesRepresentative: boolean | undefined;
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;
  sanitizedUrl!: any;
  shareLink: any;
  StreetViewOnePlace!: boolean;
  KanbanStages: any[] = [];

  // Improved dropdown management
  activeDropdownId: number | null = null;
  isUpdatingStage = false;

  @ViewChild('statusModal', { static: true }) statusModal!: TemplateRef<any>;
  htmlContent!: SafeHtml;
  private modalRef?: NgbModalRef;
  isLoadingstatus = true;
  isLoading = true;
  skeletonItems = Array(6);
  selectedStageName = 'All';
  stages: Stage[] = [];
  selectedStageId = 0;
  allShoppingCenters: Center[] = [];
  CampaignId!: any;
  @ViewChild('mailModal', { static: true }) mailModalTpl!: TemplateRef<any>;

  selectedMailSubject = '';
  selectedMailDate = new Date();
  selectedMailBody: SafeHtml = '';
  openedEmail!: Email;

  private subscriptions: Subscription[] = [];
  private subscripe = new Subscription();

  submissions: any;
  @ViewChild('submission', { static: true }) submissionModal!: TemplateRef<any>;
  Campaign: any;

  imageLoadingStates: { [key: number]: boolean } = {};
  imageErrorStates: { [key: number]: boolean } = {};
  openOrgMenuId: number | null = null;
  orgMenuPos: { top?: string; left?: string } = {};
  isLoadingInfo = false;
  infoData: any = null;
  conclusion: any;
  score: any;
  cId!: number;
  orgName!: string;
  Array = Array; // expose global Array constructor
  rotatingKeys: { [id: number]: number } = {};
  openMenuId: number | null = null;
  openStageId: number | null = null;
  dataReady = false;

  constructor(
    private markerService: MapsService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private viewManagerService: ViewManagerService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadStages();

    this.subscriptions.push(
      this.viewManagerService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id;
        if (id === 0) {
          this.selectedStageName = 'All';
        } else {
          const stage = this.stages.find((s) => s.id === id);
          this.selectedStageName = stage ? stage.stageName : '';
        }
      })
    );

    this.General = new General();
    this.savedMapView = localStorage.getItem('mapView');

    this.activatedRoute.params.subscribe((params: any) => {
      // this.BuyBoxId = params.buyboxid
      this.orgId = params.orgid;
      this.Campaign = params.campaign;

      // localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem('OrgId', this.orgId);
    });

    this.subscripe.add(
      this.viewManagerService.allShoppingCenters$.subscribe((centers) => {
        this.allShoppingCenters = centers;
      })
    );

    this.subscriptions.push(
      this.viewManagerService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers;
        if (centers && centers.length > 0) {
          this.getAllMarker();
        }
      })
    );

    this.isLoading = true;
    this.skeletonItems = Array(6);

    this.subscriptions.push(
      this.viewManagerService.filteredCenters$.subscribe((centers) => {
        this.ngZone.run(() => {
          this.cardsSideList = centers;
          this.cdr.markForCheck();
        });

        this.cardsSideList.forEach((center: any) => {
          center.lastOutgoingEmail = null;
          center.lastIncomingEmail = null;
          // Initialize dropdown state if not exists
          if (center.isDropdownOpen === undefined) {
            center.isDropdownOpen = false;
          }

          if (center.SentMails && Array.isArray(center.SentMails)) {
            const outgoing = center.SentMails.filter(
              (mail: any) => mail.Direction == 2
            ).sort(
              (a: any, b: any) =>
                new Date(b.Date).getTime() - new Date(a.Date).getTime()
            );

            const incoming = center.SentMails.filter(
              (mail: any) => mail.Direction == 1
            ).sort(
              (a: any, b: any) =>
                new Date(b.Date).getTime() - new Date(a.Date).getTime()
            );

            center.lastOutgoingEmail = outgoing.length > 0 ? outgoing[0] : null;
            center.lastIncomingEmail = incoming.length > 0 ? incoming[0] : null;
          }
        });

        if (centers && centers.length > 0) {
          this.isLoading = false;
        }
      })
    );

    this.subscriptions.push(
      this.viewManagerService.kanbanStages$.subscribe((stages) => {
        this.KanbanStages = stages;
      })
    );

    this.subscriptions.push(
      this.viewManagerService.loadingComplete$.subscribe((done) => {
        this.isLoading = !done; // show loader until both flags are satisfied
        this.dataReady = done;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Fixed dropdown toggle method
  toggleDropdown(place: any, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Don't allow toggle if currently updating stage
    if (this.isUpdatingStage) {
      return;
    }

    // Close all other dropdowns first
    this.cardsSideList.forEach((p) => {
      if (p.Id !== place.Id) {
        p.isDropdownOpen = false;
      }
    });

    // Toggle the current dropdown
    place.isDropdownOpen = !place.isDropdownOpen;
    this.activeDropdownId = place.isDropdownOpen ? place.Id : null;

    this.cdr.markForCheck();
  }

  // Fixed select stage method
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

    // Set updating flag to prevent dropdown toggle during update
    this.isUpdatingStage = true;

    // Update the shopping center's stage immediately for UI feedback
    shoppingCenter.kanbanStageId = stageId;

    // Close the dropdown
    shoppingCenter.isDropdownOpen = false;
    this.activeDropdownId = null;

    // Update the stage through the service
    this.viewManagerService.updatePlaceKanbanStage(
      marketSurveyId,
      stageId,
      shoppingCenter,
      this.CampaignId
    );

    this.cdr.markForCheck();

    // Reset updating flag after a short delay
    setTimeout(() => {
      this.isUpdatingStage = false;
    }, 100);
  }

  // Improved document click handler
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    // Only handle clicks if not currently updating stage
    if (this.isUpdatingStage) {
      return;
    }

    // Check if click is outside any stage dropdown
    if (this.activeDropdownId && target) {
      const clickedDropdown = target.closest('.custom-dropdown');

      // If clicked outside all dropdowns, close them
      if (!clickedDropdown) {
        this.cardsSideList.forEach((place) => {
          place.isDropdownOpen = false;
        });
        this.activeDropdownId = null;
        this.cdr.markForCheck();
      }
    }
  }

  // Rest of your existing methods remain the same...
  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    this.map = await this.viewManagerService.initializeMap(
      'mappopup',
      lat,
      lng
    );
  }

  async getAllMarker() {
    try {
      const { Map } = await google.maps.importLibrary('maps');
      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: lat,
            lng: lng,
          },
          zoom: zoom,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      } else {
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: this.shoppingCenters[0].Latitude,
            lng: this.shoppingCenters[0].Longitude,
          },
          zoom: 8,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      }

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      this.GetPolygons();
      this.createCustomMarkers(this.buyboxCategories);
    } finally {
      // Any cleanup code
    }
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
    this.cdr.markForCheck();
  }

  private saveMapView(map: any): void {
    const center = map.getCenter();
    const zoom = map.getZoom();
    localStorage.setItem(
      'mapView',
      JSON.stringify({
        lat: center.lat(),
        lng: center.lng(),
        zoom: zoom,
      })
    );
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
    });
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );
    const allProperties = [...(this.shoppingCenters || [])];
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
      this.cdr.markForCheck();
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = Number.parseFloat(property.Latitude);
    const lng = Number.parseFloat(property.Longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }
    return bounds?.contains({ lat, lng });
  }

  GetPolygons(): void {
    const body: any = {
      Name: 'PolygonStats',
      Params: {
        CampaignId: this.CampaignId,
      },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
        this.markerService.drawMultiplePolygons(this.map, this.Polygons);
      },
    });
  }

  getPolygons() {
    const body: any = {
      Name: 'GetBuyBoxSCsIntersectPolys',
      Params: {
        CampaignId: this.CampaignId,
        PolygonSourceId: 0,
      },
    };
    this.placesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json;
      this.markerService.drawMultiplePolygons(this.map, this.Polygons);
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

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManagerService.sanitizeUrl(url);
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

    const lat = Number.parseFloat(this.General.modalObject.Latitude);
    const lng = Number.parseFloat(this.General.modalObject.Longitude);

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

  copyLink(link: string) {
    navigator.clipboard.writeText(link);
  }

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

  getSelectedStageName(stageId: number): string {
    return this.viewManagerService.getSelectedStageName(stageId);
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: 'xl',
      centered: true,
      windowClass: 'contact-broker-modal-class',
    });
    modalRef.componentInstance.center = center;
    // modalRef.componentInstance.buyboxId = this.BuyBoxId
  }

  trackById(index: number, item: any): number {
    return item?.Id || item?.id || index;
  }

  requestCenterStatus(shoppingCenterId: number, campaignId: any) {
    this.isLoadingstatus = true;

    this.modalRef = this.modalService.open(this.statusModal, {
      size: 'lg',
      scrollable: true,
    });

    this.placesService
      .GetSiteCurrentStatus(shoppingCenterId, campaignId)
      .subscribe({
        next: (res: any) => {
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(res);
          this.isLoadingstatus = false;
          this.cdr.markForCheck();
        },
        error: () => {
          const errHtml = '<p>Error loading content</p>';
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml);
          this.isLoadingstatus = false;
          this.cdr.markForCheck();
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
    const gapSize = (5 / 100) * totalLength;

    if (percentage === 100) {
      return `${totalLength} 0`;
    }

    const progressLength = (percentage / 100) * (totalLength - 2 * gapSize);
    return `${progressLength} ${totalLength}`;
  }

  getCircleProgressBackground(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155;
    const totalLength = circumference;
    const gapSize = (5 / 100) * totalLength;

    if (percentage === 100) {
      return `0 ${totalLength}`;
    }

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

    return submissions.some((submission) => submission.SubmmisionLink !== null);
  }

  loadStages(): void {
    const body = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.stages = res.json
          .map((s: any) => ({
            id: +s.id,
            stageName: s.stageName,
            stageOrder: +s.stageOrder,
            isQualified: s.isQualified,
            kanbanTemplateId: +s.kanbanTemplateId,
          }))
          .sort((a: Stage, b: Stage) => a.stageOrder - b.stageOrder);

        if (this.selectedStageId === 0) {
          this.selectedStageName = 'All';
        } else {
          const current = this.stages.find(
            (s) => s.id === this.selectedStageId
          );
          this.selectedStageName = current ? current.stageName : 'Stage';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onStageChange(id: number) {
    this.selectedStageId = id;
    this.viewManagerService.setSelectedStageId(id);
  }

  selectStagekan(id: number) {
    this.viewManagerService.setSelectedStageId(id);
  }

  getSentMails(shopping: any): SentMails[] {
    const raw: any[] = shopping?.SentMails ?? [];
    return raw.map((mail) => ({
      Id: mail.ID,
      Date: new Date(mail.Date),
      Direction: mail.Direction,
    }));
  }

  openMailPopup(mailId: number): void {
    const payload = {
      Name: 'GetMail',
      Params: { mailid: mailId },
    };

    this.placesService.GenericAPIHtml(payload).subscribe({
      next: (res: any) => {
        this.openedEmail = res.json[0];

        this.openedEmail.Body = this.sanitizer.bypassSecurityTrustHtml(
          this.openedEmail.Body
        );

        this.modalService.open(this.mailModalTpl, {
          size: 'lg',
        });
      },
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

  onImageLoad(shoppingId: number): void {
    this.imageLoadingStates[shoppingId] = false;
    this.imageErrorStates[shoppingId] = false;
    this.cdr.markForCheck();
  }

  onImageError(shopping: any): void {
    this.imageLoadingStates[shopping.Id] = false;
    this.imageErrorStates[shopping.Id] = true;

    if (
      shopping.MainImage &&
      !shopping.MainImage.includes('DefaultImage.png')
    ) {
      shopping.MainImage = 'assets/Images/DefaultImage.png';
    }
    this.cdr.markForCheck();
  }

  getImageUrl(shopping: any): string {
    return shopping.MainImage || 'assets/Images/DefaultImage.png';
  }

  finContactMessage(shoppingCenter: Center): void {
    (window as any).electronMessage.findContacts(
      JSON.stringify({
        shoppingCenterName: shoppingCenter.CenterName,
        shoppingCenterAddress: shoppingCenter.CenterAddress,
        shoppingCenterId: shoppingCenter.Id,
      })
    );

    this.getShoppingCenterContact(shoppingCenter.Id);
  }
  getShoppingCenterContact(centerId: any): void {
    const body: any = {
      Name: 'GetShoppingCenterContact',
      MainEntity: null,
      Params: {
        ShoppingCenterId: centerId,
      },
      Json: null,
    };
    this.placesService.GenericAPI(body).subscribe((data) => {
      if (data.json && data.json.length) {
        const newContacts = data.json.map((c: any) => ({
          ID: c.id,
          Name: c.name,
          Firstname: c.firstname ?? '',
          LastName: c.lastname ?? '', // no source in original, so set to empty or default
          Email: c.email,
          ContactId: c.contactId,
        }));

        const center = this.cardsSideList.find((sc) => sc.Id == centerId);

        if (!center) {
          return;
        }
        if (!center.ShoppingCenter) {
          center.ShoppingCenter = {
            Places: [],
            Comments: [],
            Reactions: [],
            BuyBoxPlaces: [],
            ManagerOrganization: [...newContacts], // Initialize with the new one
            UserSubmmision: [],
          };
        } else {
          // If ManagerOrganization exists, append; else create and assign
          center.ShoppingCenter.ManagerOrganization = [...newContacts];
        }
      } else {
        setTimeout(() => {
          this.getShoppingCenterContact(centerId);
        }, 4000);
      }
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
      this.getShoppingCenterContact(shoppingCenterId);
    });
  }
  toggleOrgMenu(id: number, event: MouseEvent) {
    event.stopPropagation();
    if (this.openOrgMenuId === id) {
      this.closeOrgMenu();
    } else {
      this.openOrgMenuId = id;
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick, true);
      });
    }
  }

  closeOrgMenu() {
    this.openOrgMenuId = null;
    document.removeEventListener('click', this.handleOutsideClick, true);
  }
  // make sure to bind 'this' when declaring the handler
  handleOutsideClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.org-mini-menu') && !target.closest('.leased-by')) {
      this.closeOrgMenu();
    }
  };

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
        this.score = res.json[0].score || null;
        this.conclusion = res.json[0].conclusion || null;

        this.isLoadingInfo = false;
        this.modalService.open(content, {
          size: 'md',
          backdrop: true,
          centered: true,
        });
      }
    });
  }
  // Example: inside your component class
  get hasUnscoredCenters(): boolean {
    return this.cardsSideList?.some((sc) => !sc.MainImage) ?? false;
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
