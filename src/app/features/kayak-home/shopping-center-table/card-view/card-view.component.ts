import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy, // Added OnPush import
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription, combineLatest } from 'rxjs';
import { ContactBrokerComponent } from '../contact-broker/contact-broker.component';
import { Email } from 'src/app/shared/models/email';
import { AddContactComponent } from '../add-contact/add-contact.component';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Added OnPush strategy
})
export class CardViewComponent implements OnInit, OnDestroy {
  Array = Array; // expose global Array constructor

  General: General = new General();
  cardsSideList: Center[] = [];
  map: any;
  BuyBoxId!: any;
  orgId!: any;
  mapViewOnePlacex = false;
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
  KanbanStages: any[] = [];
  openOrgMenuId: number | null = null;
  orgMenuPos: { top?: string; left?: string } = {};

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
  openedEmail!: Email;

  private subscriptions: Subscription[] = [];
  private subscripe = new Subscription();

  submissions: any;
  @ViewChild('submission', { static: true }) submissionModal!: TemplateRef<any>;
  Campaign: any;

  imageLoadingStates: { [key: number]: boolean } = {};
  imageErrorStates: { [key: number]: boolean } = {};
  orgName!: string;

  @ViewChild('addContact') addContactModal!: TemplateRef<any>;
  selectedShoppingCenterId: any;
  infoData: any = null;
  conclusion: any;
  score: any;
  isLoadingInfo = false;
  showSaveToast: any;
  rotatingKeys: { [id: number]: number } = {};
  openMenuId: number | null = null;
  openStageId: number | null = null;
  dataReady = false;
  scoringId: number | null = null; // track the current shopping center being scored

  constructor(
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private viewManagerService: ViewManagerService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.viewManagerService.loadingComplete$.subscribe((done) => {
        this.isLoading = !done; // show loader until both flags are satisfied
        this.dataReady = done;
        this.cdr.markForCheck();
      })
    );

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
        this.cdr.markForCheck();
      })
    );

    this.General = new General();
    this.savedMapView = localStorage.getItem('mapView');

    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.orgId = +params.orgId;
      this.Campaign = params.campaign;
      this.CampaignId = params.campaignId;
      this.orgName = params.orgName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.orgId);
    });

    this.subscripe.add(
      this.viewManagerService.allShoppingCenters$.subscribe((centers) => {
        this.allShoppingCenters = centers;
        this.cdr.markForCheck();
      })
    );

    this.subscriptions.push(
      this.viewManagerService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers;
        this.cdr.markForCheck();
      })
    );

    this.skeletonItems = Array(6);

    this.subscriptions.push(
      this.viewManagerService.filteredCenters$.subscribe((centers) => {
        this.ngZone.run(() => {
          this.cardsSideList = [...centers].sort((a: any, b: any) => {
            const aTime = this.parseDate(a.LastUpdateDate);
            const bTime = this.parseDate(b.LastUpdateDate);
            return bTime - aTime; // newest first
          });
        });

        this.cdr.markForCheck();
      })
    );

    this.subscriptions.push(
      this.viewManagerService.kanbanStages$.subscribe({
        next: (stages) => {
          if (stages && Array.isArray(stages)) {
            this.KanbanStages = [...stages]; // Create a new array reference
            this.cdr.markForCheck(); // Force change detection
          }
        },
      })
    );

    this.subscriptions.push(
      this.viewManagerService.dataLoadedEvent$.subscribe(() => {
        // Data is loaded, perform any additional initialization
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Enhanced stage selection that ensures proper filtering without full reloads
   */
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
    this.openStageId = null;
    this.viewManagerService.updatePlaceKanbanStage(
      marketSurveyId,
      stageId,
      shoppingCenter
    );

    setTimeout(() => {
      this.isUpdatingStage = false;
      this.cdr.markForCheck();
    }, 100);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    this.map = await this.viewManagerService.initializeMap(
      'mappopup',
      lat,
      lng
    );
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
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

  getSelectedStageName(stageId: number): string {
    return this.viewManagerService.getSelectedStageName(stageId);
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.center = center;
    modalRef.componentInstance.buyboxId = this.BuyBoxId;
  }

  /**
   * TrackBy function for *ngFor loops to improve performance
   */
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
        },
        error: () => {
          const errHtml = '<p>Error loading content</p>';
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml);
          this.isLoadingstatus = false;
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
      },
    });
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
    event.stopPropagation(); // prevents bubbling to document

    if (this.openOrgMenuId === id) {
      this.closeOrgMenu();
    } else {
      this.openOrgMenuId = id;
      this.activeDropdownId = id;
      this.openModalSubmission;
      // only attach listener once per open
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick, true);
      });
    }
  }

  closeOrgMenu() {
    this.openOrgMenuId = null;
    this.activeDropdownId = null;
    document.removeEventListener('click', this.handleOutsideClick, true);
  }

  // make sure to bind 'this' when declaring the handler
  handleOutsideClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.org-mini-menu') && !target.closest('.leased-by')) {
      this.closeOrgMenu();
    }
  };

  private parseDate(dateValue: any): number {
    if (!dateValue) return 0;

    if (dateValue instanceof Date) {
      return dateValue.getTime();
    }

    if (typeof dateValue === 'string') {
      const normalized = dateValue.replace(' ', 'T');
      const parsed = Date.parse(normalized);
      if (isNaN(parsed)) {
        return 0;
      }
      return parsed;
    }

    if (typeof dateValue === 'number') {
      return dateValue;
    }
    return 0;
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
        this.score = res.json[0].score || null;
        this.conclusion = res.json[0].conclusion || null;

        this.isLoadingInfo = false;
        this.modalService.open(content, {
          size: 'xl',
          backdrop: true,
          centered: true,
        });
      },
    });
  }

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
      }, 3500);
    } else {
    }
  }
  toggleMenu(Id: number, event: MouseEvent, stage?: boolean) {
    event.stopPropagation();
    if (!stage) {
      this.openMenuId = this.openMenuId === Id ? null : Id;
      this.openStageId = null;
    }
    if (stage) {
      this.openStageId = this.openStageId === Id ? null : Id;
      this.openMenuId = null;
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
  getscore(shopping: any) {
    if (!shopping.Score) {
      this.scoringId = shopping.Id; // set loader only for this center
    }
    this.placesService.GetScore(this.CampaignId, shopping.Id).subscribe({
      next: (response) => {
        this.scoringId = null; // stop loader when finished
        this.viewManagerService.loadShoppingCenters(this.CampaignId);
        if (!response) {
          this.showToast(
            `Shopping center ${shopping.CenterName} has already been scored`
          );
        } else {
          this.showToast(
            `Shopping center ${shopping.CenterName} scored successfully`
          );
        }
      },
      error: () => {
        this.scoringId = null; // also stop loader if error happens
      },
    });
  }
  getSourceDisplay(source: string): string {
    try {
      // Check if it's a URL
      const url = new URL(source);
      // Extract hostname, remove 'www.'
      let domain = url.hostname.replace(/^www\./, '');
      // Optionally, remove TLD (if you want just 'fogorealty' instead of 'fogorealty.com')
      domain = domain.split('.')[0];
      return domain;
    } catch {
      // Not a valid URL → return the source as-is
      return source;
    }
  }
  
}
