import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  Renderer2,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbCarousel, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center, Reaction } from '../../../../shared/models/shoppingCenters';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NgForm } from '@angular/forms';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { General } from 'src/app/shared/models/domain';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { StateService } from 'src/app/core/services/state.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { Subject, Subscription, fromEvent, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  trigger,
  style,
  animate,
  transition,
  keyframes,
} from '@angular/animations';

interface ShortcutOption {
  icon: string;
  label: string;
  action: (shopping: any) => void;
}

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

declare const google: any;

@Component({
  selector: 'app-social-view',
  templateUrl: './social-view.component.html',
  styleUrls: ['./social-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('heartAnimation', [
      transition(':enter', [
        animate(
          '3s cubic-bezier(0.17, 0.89, 0.32, 1.28)',
          keyframes([
            style({
              transform: 'scale(0)',
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: 'scale(1.2)',
              opacity: 0.9,
              offset: 0.15,
            }),
            style({
              transform: 'scale(1)',
              opacity: 1,
              offset: 0.3,
            }),
            style({
              transform: 'scale(1.1) translateY(-40px)',
              opacity: 1,
              offset: 0.5,
            }),
            style({
              transform: 'scale(1) translateY(-80px)',
              opacity: 0.9,
              offset: 0.7,
            }),
            style({
              transform: 'scale(0.8) translateY(-120px)',
              opacity: 0,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class SocialViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('commentsContainer') commentsContainer?: ElementRef;
  @ViewChild('carousel') carousel!: NgbCarousel;
  @ViewChild('carousel', { read: ElementRef }) carouselElement!: ElementRef;
  @ViewChild('galleryModal', { static: true }) galleryModal!: TemplateRef<any>;
  @ViewChild('contactsModal', { static: true })
  contactsModalTemplate!: TemplateRef<any>;
  @ViewChild('MapViewPlace', { static: true }) MapViewPlace!: TemplateRef<any>;
  @ViewChild('StreetViewPlace', { static: true })
  StreetViewPlace!: TemplateRef<any>;
  @ViewChild('panelContent') panelContent!: ElementRef;
  @ViewChild('deleteShoppingCenterModal')
  deleteShoppingCenterModal!: TemplateRef<any>;

  @Output() viewChange = new EventEmitter<number>();

  // Component state
  isPanelOpen = false;
  currentShopping: Center | null = null;
  isMobileView = false;
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  BuyBoxName!: string;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  selectedIdCard: number | null = null;
  selectedId: number | null = null;
  placeImage: string[] = [];
  replyingTo: { [key: number]: number | null } = {};
  newComments: { [key: number]: string } = {};
  newReplies: { [key: number]: string } = {};
  showComments: { [key: number]: boolean } = {};
  showDetails: boolean[] = [];
  likedShoppings: { [key: number]: boolean } = {};
  isLikeInProgress = false;
  sanitizedUrl!: SafeResourceUrl;
  // isOpen = false;
  mapViewOnePlacex = false;
  StreetViewOnePlace = false;
  selectedState = '0';
  selectedCity = '';
  ShareOrg: ShareOrg[] = [];
  selectedCenterId: number | null = null;
  currentIndex = -1;
  selectedRating: string | null = null;
  CustomPlace!: LandingPlace;
  ShoppingCenter!: any;
  shareLink = '';
  newContact: ContactForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  OrganizationContacts: any[] = [];
  shoppingCenterIdToDelete: number | null = null;
  buyboxPlaces: BbPlace[] = [];
  showbackIds: number[] = [];
  mapsLoaded = false;
  DeletedSC: any;

  // Touch handling
  private panelStartY = 0;
  private panelCurrentY = 0;
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private readonly PANEL_SWIPE_THRESHOLD = 100;

  heartVisible = false;
  heartX = 0;
  heartY = 0;
  private heartTimeout: any;
  private lastClickTime = 0;
  private readonly DOUBLE_CLICK_THRESHOLD = 300; // ms

  // Cleanup
  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();
  private documentTouchListeners: (() => void)[] = [];
  private clickTimeout: any;
  private categoryNameCache = new Map<number, string>();
  private unitSizeCache = new Map<string, string>();
  private commentSortCache = new WeakMap<any[], any[]>();
  private mapsTimeout: any;
  private globalClickListeners: (() => void)[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private placesService: PlacesService,
    private viewManagerService: ViewManagerService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
    this.General = new General();
    this.selectedState = '';
    this.selectedCity = '';

    const paramsSub = this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      this.initializeData();
    });

    this.subscriptions.add(paramsSub);

    this.mapsTimeout = setTimeout(() => {
      this.mapsLoaded = true;
      this.cdr.markForCheck();
    }, 2000);

    this.subscriptions.add(
      fromEvent(window, 'resize')
        .pipe(debounceTime(250), takeUntil(this.destroy$))
        .subscribe(() => this.checkMobileView())
    );
  }

  async initializeData() {
    try {
      this.spinner.show();
      // Load data in parallel for better performance
      const [shoppingCenters, buyboxCategories, shareOrg, buyboxPlaces] =
        await Promise.all([
          this.viewManagerService.getShoppingCenters(this.BuyBoxId),
          this.viewManagerService.getBuyBoxCategories(this.BuyBoxId),
          this.viewManagerService.getOrganizationById(this.OrgId),
          this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId),
        ]);

      this.shoppingCenters = shoppingCenters;
      this.stateService.setShoppingCenters(shoppingCenters);

      this.buyboxCategories = buyboxCategories;
      this.stateService.setBuyboxCategories(buyboxCategories);

      this.ShareOrg = shareOrg;
      this.stateService.setShareOrg(shareOrg);

      this.buyboxPlaces = buyboxPlaces;
      this.stateService.setBuyboxPlaces(buyboxPlaces);

      // Initialize arrays based on data length
      this.showDetails = new Array(this.shoppingCenters.length).fill(false);

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      this.spinner.hide();
    }
  }

  ngAfterViewInit(): void {
    this.setupGlobalClickListener();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions and listeners
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();

    this.globalClickListeners.forEach((listener) => listener());
    this.removeGlobalTouchListeners();

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }

    if (this.mapsTimeout) {
      clearTimeout(this.mapsTimeout);
    }

    document.body.classList.remove('panel-open');
    if (this.heartTimeout) {
      clearTimeout(this.heartTimeout);
    }
  }

  // UI Interaction Methods
  scrollUp(): void {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: -cardHeight,
      behavior: 'smooth',
    });
  }

  scrollDown(): void {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: cardHeight,
      behavior: 'smooth',
    });
  }

  toggleDetails(index: number, shopping: Center, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index];
      this.cdr.markForCheck();
    }
  }

  hideAllDetails(): void {
    this.showDetails.fill(false);
    this.cdr.markForCheck();
  }

  toggleComments(shopping: Center, event: MouseEvent): void {
    event.stopPropagation();
    this.showComments[shopping.Id] = !this.showComments[shopping.Id];
    this.cdr.markForCheck();
  }

  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false;
    }
  }

  // Comment and Reply Methods
  addComment(shopping: Center, marketSurveyId: number): void {
    if (!this.newComments[marketSurveyId]?.trim()) {
      return;
    }

    const commentText = this.newComments[marketSurveyId];
    this.newComments[marketSurveyId] = '';

    const body = {
      Name: 'CreateComment',
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        Comment: commentText,
        ParentCommentId: 0,
      },
    };

    const commentSub = this.placesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (!shopping.ShoppingCenter.Comments) {
          shopping.ShoppingCenter.Comments = [];
        }

        shopping.ShoppingCenter.Comments.push({
          Comment: commentText,
          CommentDate: new Date().toISOString(),
          Id: response.json?.Id || Date.now(), // Use response ID or fallback
        });

        shopping.ShoppingCenter.Comments = this.sortCommentsByDate(
          shopping.ShoppingCenter.Comments
        );

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        // Provide user feedback for error
      },
    });

    this.subscriptions.add(commentSub);
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
      return;
    }

    const replyText = this.newReplies[commentId];
    this.newReplies[commentId] = '';

    const body = {
      Name: 'CreateComment',
      Params: {
        MarketSurveyId: marketSurveyId,
        Comment: replyText,
        ParentCommentId: commentId,
      },
    };

    const replySub = this.placesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.replyingTo[marketSurveyId] = null;

        const shoppingCenter = this.shoppingCenters.find(
          (sc) => sc.MarketSurveyId === marketSurveyId
        );

        if (shoppingCenter && shoppingCenter.ShoppingCenter.Comments) {
          shoppingCenter.ShoppingCenter.Comments.push({
            Comment: replyText,
            CommentDate: new Date().toISOString(),
            ParentCommentId: commentId,
            Id: response.json?.Id || Date.now(), // Use response ID or fallback
          });

          shoppingCenter.ShoppingCenter.Comments = this.sortCommentsByDate(
            shoppingCenter.ShoppingCenter.Comments
          );
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        // Provide user feedback for error
      },
    });

    this.subscriptions.add(replySub);
  }

  toggleReply(shopping: Center, commentId: number): void {
    if (!this.replyingTo[shopping.MarketSurveyId]) {
      this.replyingTo[shopping.MarketSurveyId] = null;
    }

    this.replyingTo[shopping.MarketSurveyId] =
      this.replyingTo[shopping.MarketSurveyId] === commentId ? null : commentId;

    this.cdr.markForCheck();
  }

  trimComment(value: string, marketSurveyId: number): void {
    if (value) {
      this.newComments[marketSurveyId] = value.trimLeft();
    } else {
      this.newComments[marketSurveyId] = '';
    }
  }

  // Like/Reaction Methods
  handleClick(
    shopping: Center,
    likeTpl: TemplateRef<any>,
    index: number
  ): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.addLike(shopping, 1);
    } else {
      this.clickTimeout = setTimeout(() => {
        const nextShopping = this.getNextShopping(index);
        this.open(likeTpl, shopping, nextShopping ? nextShopping : shopping);
        this.clickTimeout = null;
      }, 250);
    }
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem('ContactId');
    // if (!contactIdStr) {
    //   return; // Handle missing contact ID
    // }

    const contactId = Number.parseInt(contactIdStr!, 10);

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some(
        (reaction: Reaction) => reaction.ContactId === contactId
      )
    ) {
      return; // Already liked
    }

    if (this.isLikeInProgress) {
      return; // Prevent duplicate requests
    }

    this.isLikeInProgress = true;
    const isLiked = this.likedShoppings[shopping.MarketSurveyId];

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    if (!isLiked) {
      shopping.ShoppingCenter.Reactions.push({
        ContactId: contactId,
        ReactionId: reactionId,
        ReactionDate: new Date().toISOString(),
      });
      this.likedShoppings[shopping.MarketSurveyId] = true;
    }

    this.cdr.markForCheck();

    const body = {
      Name: 'CreatePropertyReaction',
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        ReactionId: reactionId,
      },
    };

    const likeSub = this.placesService.GenericAPI(body).subscribe({
      next: (response: any) => {},
      error: (error) => {
        if (!isLiked) {
          shopping.ShoppingCenter.Reactions.pop();
          this.likedShoppings[shopping.MarketSurveyId] = false;
        }
      },
      complete: () => {
        this.isLikeInProgress = false;
        this.cdr.markForCheck();
      },
    });

    this.subscriptions.add(likeSub);
  }

  isLiked(shopping: Center): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1;
  }

  // Modal Methods
  open(content: any, currentShopping: Center, nextShopping: Center) {
    this.modalService.open(content, {
      windowClass: 'custom-modal',
    });
    this.General.modalObject = currentShopping;
    this.General.nextModalObject = nextShopping;
  }

  getNextShopping(currentIndex: number): Center | null {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      const nextIndex = (currentIndex + 1) % this.shoppingCenters.length;
      return this.shoppingCenters[nextIndex];
    }
    return null;
  }

  async openMapViewPlace(content: TemplateRef<any>, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    if (!this.mapsLoaded) {
      this.mapsLoaded = true;
    }

    if (modalObject) {
      this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
    }
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      return;
    }

    try {
      const { Map } = (await google.maps.importLibrary('maps')) as any;
      const mapDiv = document.getElementById('mappopup') as HTMLElement;

      if (!mapDiv) {
        return;
      }

      const map = new Map(mapDiv, {
        center: { lat, lng },
        zoom: 14,
      });

      new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: 'Location Marker',
      });
    } catch (error) {
      console.error('Error loading map:', error);
    }
  }

  openStreetViewPlace(content: TemplateRef<any>, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    this.General.modalObject = modalObject;

    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    } else {
      setTimeout(() => {
        this.viewOnStreet();
      }, 100);
    }
  }

  viewOnStreet() {
    this.StreetViewOnePlace = true;
    const lat = +this.General.modalObject.StreetLatitude;
    const lng = +this.General.modalObject.StreetLongitude;
    const heading = this.General.modalObject.Heading || 165;
    const pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
        console.error('Street view element not found');
      }
    });
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    try {
      const panorama = this.viewManagerService.initializeStreetView(
        'street-view',
        lat,
        lng,
        heading,
        pitch
      );

      if (!panorama) {
        console.error('Failed to initialize street view');
      }

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error initializing street view:', error);
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cdr.markForCheck();
  }

  openGallery(shoppingCenterId: number) {
    this.GetPlaceDetails(0, shoppingCenterId);
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  GetPlaceDetails(placeId: number, shoppingCenterId: number): void {
    this.spinner.show();

    const body = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: shoppingCenterId,
        buyboxid: this.BuyBoxId,
      },
    };

    const detailsSub = this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.CustomPlace = data.json?.[0] || null;
        this.ShoppingCenter = this.CustomPlace;

        if (this.ShoppingCenter && this.ShoppingCenter.Images) {
          this.placeImage = this.ShoppingCenter.Images?.split(',').map(
            (link: string) => link.trim()
          );
        } else {
          this.placeImage = [];
        }

        this.spinner.hide();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error getting place details:', error);
        this.spinner.hide();
      },
    });

    this.subscriptions.add(detailsSub);
  }

  openContactsModal(content: TemplateRef<any>): void {
    this.spinner.show();

    const body = {
      Name: 'GetOrganizationContacts',
      Params: {
        organizationId: this.OrgId,
      },
    };

    const contactsSub = this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.OrganizationContacts = data.json;
        } else {
          this.OrganizationContacts = [];
        }

        this.spinner.hide();
        this.modalService.open(content, {
          size: 'lg',
          centered: true,
        });

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error getting organization contacts:', error);
        this.spinner.hide();
      },
    });

    this.subscriptions.add(contactsSub);
  }

  openAddContactModal(content: TemplateRef<any>): void {
    this.newContact = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    };

    this.modalService.open(content, {
      ariaLabelledBy: 'modal-add-contact',
      size: 'lg',
      centered: true,
      scrollable: true,
    });
  }

  addContact(form: NgForm): void {
    if (!form.valid) {
      return;
    }

    this.spinner.show();

    const body = {
      Name: 'AddContactToOrganization',
      Params: {
        FirstName: this.newContact.firstName,
        LastName: this.newContact.lastName,
        OrganizationId: this.OrgId,
        email: this.newContact.email,
        password: this.newContact.password,
      },
    };

    const addContactSub = this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        this.newContact = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        };

        form.resetForm();
        this.modalService.dismissAll();
        this.openContactsModal(this.contactsModalTemplate);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error adding contact:', error);
        this.spinner.hide();
      },
    });

    this.subscriptions.add(addContactSub);
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: Center
  ) {
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  async deleteShCenter() {
    if (!this.shoppingCenterIdToDelete) {
      return;
    }

    // Optimistic UI update
    this.shoppingCenters = this.shoppingCenters.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x
    );

    try {
      this.spinner.show();
      await this.viewManagerService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete
      );
      this.modalService.dismissAll();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error deleting shopping center:', error);
      // Revert optimistic update on error
      this.shoppingCenters = this.shoppingCenters.map((x) =>
        x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: false } : x
      );
    } finally {
      this.spinner.hide();
    }
  }

  async RestoreShoppingCenter(
    marketSurveyId: number,
    deleted: boolean
  ): Promise<void> {
    this.spinner.show();

    try {
      await this.viewManagerService.restoreShoppingCenter(
        marketSurveyId,
        deleted
      );

      const marketSurveyIdNum = Number(marketSurveyId);
      this.shoppingCenters = this.shoppingCenters.map((center) => {
        if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
          return { ...center, Deleted: false };
        }
        return center;
      });

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error restoring shopping center:', error);
    } finally {
      this.spinner.hide();
    }
  }

  async refreshShoppingCenters() {
    try {
      this.spinner.show();

      const [shoppingCenters, buyboxPlaces] = await Promise.all([
        this.viewManagerService.getShoppingCenters(this.BuyBoxId),
        this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId),
      ]);

      this.shoppingCenters = shoppingCenters;
      this.buyboxPlaces = buyboxPlaces;
      this.showbackIds = [];

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error refreshing shopping centers:', error);
    } finally {
      this.spinner.hide();
    }
  }

  openLink(content: TemplateRef<any>, modalObject?: any) {
    this.shareLink = '';

    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    if (modalObject) {
      if (modalObject.CenterAddress) {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.ShoppingCenter.Places[0].Id}/${modalObject.Id}/${this.BuyBoxId}`;
      } else {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.Id}/0/${this.BuyBoxId}`;
      }
    } else {
      this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/home/${this.BuyBoxId}/${this.OrgId}`;
    }

    this.cdr.markForCheck();
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        // Could add a toast notification here
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  }

  selectCenter(centerId: number): void {
    this.selectedCenterId = centerId;
    const selectedIndex = this.shoppingCenters.findIndex(
      (center) => center.Id === centerId
    );

    if (selectedIndex !== -1) {
      this.General.modalObject = this.shoppingCenters[selectedIndex];
      this.currentIndex = (this.currentIndex + 1) % this.shoppingCenters.length;
      let nextIndex = (this.currentIndex + 1) % this.shoppingCenters.length;
      while (nextIndex === selectedIndex) {
        nextIndex = (nextIndex + 1) % this.shoppingCenters.length;
      }
      this.General.nextModalObject = this.shoppingCenters[nextIndex];
      this.cdr.markForCheck();
    }
  }

  rate(rating: 'dislike' | 'neutral' | 'like') {
    this.selectedRating = rating;
    this.cdr.markForCheck();
  }

  // Touch event handlers
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd() {
    if (!this.carousel) return;

    const swipeDistance = this.touchEndX - this.touchStartX;
    if (Math.abs(swipeDistance) > this.SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        this.carousel.prev();
      } else {
        this.carousel.next();
      }
    }
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  // Panel methods
  openCustomPanel(shopping: Center): void {
    this.currentShopping = shopping;
    this.isPanelOpen = true;
    this.cdr.markForCheck();

    document.body.classList.add('panel-open');

    // Add listener for panel touch events
    this.removeGlobalTouchListeners();
  }

  closeCustomPanel(): void {
    document.body.classList.remove('panel-open');

    if (this.panelContent) {
      this.renderer.setStyle(
        this.panelContent.nativeElement,
        'transform',
        'translateY(100%)'
      );
      this.renderer.setStyle(
        this.panelContent.nativeElement,
        'transition',
        'transform 0.3s ease-out'
      );

      this.isPanelOpen = false;
      this.currentShopping = null;
      this.cdr.markForCheck();
    } else {
      this.isPanelOpen = false;
      this.currentShopping = null;
      this.cdr.markForCheck();
    }

    this.removeGlobalTouchListeners();
  }

  handlePanelTouchStart(event: TouchEvent): void {
    this.panelStartY = event.touches[0].clientY;
    this.panelCurrentY = this.panelStartY;

    // Clean up existing listeners first
    this.removeGlobalTouchListeners();

    // Add new listeners
    const touchMoveListener = this.renderer.listen(
      'document',
      'touchmove',
      (e: TouchEvent) => {
        this.handlePanelTouchMove(e);
      }
    );

    const touchEndListener = this.renderer.listen(
      'document',
      'touchend',
      (e: TouchEvent) => {
        this.handlePanelTouchEnd(e);
      }
    );

    this.documentTouchListeners.push(touchMoveListener, touchEndListener);
  }

  handlePanelTouchMove(event: TouchEvent): void {
    this.panelCurrentY = event.touches[0].clientY;
    const deltaY = this.panelCurrentY - this.panelStartY;

    if (deltaY > 0) {
      if (this.panelContent) {
        this.renderer.setStyle(
          this.panelContent.nativeElement,
          'transform',
          `translateY(${deltaY}px)`
        );
        this.renderer.setStyle(
          this.panelContent.nativeElement,
          'transition',
          'none'
        );
      }
    }
  }

  handlePanelTouchEnd(event: TouchEvent): void {
    const deltaY = this.panelCurrentY - this.panelStartY;

    if (this.panelContent) {
      this.renderer.setStyle(
        this.panelContent.nativeElement,
        'transition',
        'transform 0.3s ease-out'
      );

      if (deltaY > this.PANEL_SWIPE_THRESHOLD) {
        // Swipe down - close the panel
        this.renderer.setStyle(
          this.panelContent.nativeElement,
          'transform',
          'translateY(100%)'
        );
        this.closeCustomPanel();
      } else {
        // Reset position
        this.renderer.setStyle(
          this.panelContent.nativeElement,
          'transform',
          'translateY(0)'
        );
      }
    }

    this.removeGlobalTouchListeners();
  }

  removeGlobalTouchListeners(): void {
    this.documentTouchListeners.forEach((listener) => {
      if (typeof listener === 'function') {
        listener();
      }
    });
    this.documentTouchListeners = [];
  }

  // Utility methods
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  checkMobileView(): void {
    const wasMobile = this.isMobileView;
    this.isMobileView = window.innerWidth <= 768;

    if (wasMobile !== this.isMobileView) {
      this.cdr.detectChanges();
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    if (this.categoryNameCache.has(categoryId)) {
      return this.categoryNameCache.get(categoryId)!;
    }

    const result = this.viewManagerService.getNearestCategoryName(
      categoryId,
      this.buyboxCategories
    );
    this.categoryNameCache.set(categoryId, result);
    return result;
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    const key = `${shoppingCenter.Id}`;
    if (this.unitSizeCache.has(key)) {
      return this.unitSizeCache.get(key)!;
    }

    const result =
      this.viewManagerService.getShoppingCenterUnitSize(shoppingCenter);
    this.unitSizeCache.set(key, result);
    return result;
  }

  sortCommentsByDate(comments: any[]): any[] {
    if (!comments) return [];

    if (this.commentSortCache.has(comments)) {
      return this.commentSortCache.get(comments)!;
    }

    const sorted = [...comments].sort(
      (a, b) =>
        new Date(b.CommentDate).getTime() - new Date(a.CommentDate).getTime()
    );

    this.commentSortCache.set(comments, sorted);
    return sorted;
  }

  // Tracking methods for ngFor optimization
  trackByShoppingId(index: number, item: any): number {
    return item.Id || index;
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index;
  }

  // Mobile shortcuts
  getMobileShortcutOptions(shopping: any): ShortcutOption[] {
    if (!shopping) return [];

    return [
      {
        icon: 'fa-regular fa-envelope big-text',
        label: 'Emily',
        action: (s: any) => {
          window.open(
            `/emily/${this.BuyBoxId}/${s.ShoppingCenter.ManagerOrganization[0].ID}/${s.Id}`,
            '_blank'
          );
        },
      },
      {
        icon: 'fa-solid fa-images big-text',
        label: 'View Gallery',
        action: (s: any) => {
          this.openGallery(s.Id);
        },
      },
      {
        icon: 'fa-solid fa-file-lines',
        label: 'View Details',
        action: (s: any) => {
          this.router.navigate([
            '/landing',
            s.ShoppingCenter.Places ? s.ShoppingCenter.Places[0].Id : 0,
            s.Id,
            this.BuyBoxId,
          ]);
        },
      },
      {
        icon: 'fa-solid fa-map-location-dot big-text',
        label: 'View Location',
        action: (s: any) => {
          this.openMapViewPlace(this.MapViewPlace, s);
        },
      },
      {
        icon: 'fa-solid fa-street-view',
        label: 'Street View',
        action: (s: any) => {
          this.openStreetViewPlace(this.StreetViewPlace, s);
        },
      },
      {
        icon: shopping.Deleted
          ? 'fa-solid fa-trash-arrow-up big-text'
          : 'fa-regular fa-trash-can big-text',
        label: shopping.Deleted ? 'Restore' : 'Remove Shopping',
        action: (shopping: any) => {
          if (shopping.Deleted) {
            this.RestoreShoppingCenter(
              shopping.MarketSurveyId,
              shopping.Deleted
            );
          } else {
            this.openDeleteShoppingCenterModal(
              this.deleteShoppingCenterModal,
              shopping
            );
          }
        },
      },
    ];
  }

  handleOptionClick(event: Event, option: ShortcutOption, shopping: any): void {
    event.stopPropagation();
    option.action(shopping);
  }

  // Shortcuts card
  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedIdCard === id) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    } else {
      this.selectedIdCard = id;
      setTimeout(() => {
        document.addEventListener('click', this.outsideClickHandler);
      });
    }
  }

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest(
      '.shortcuts_iconCard, .ellipsis_icont'
    );

    if (!isInside) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    }
  };

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedIdCard = null;
      this.selectedId = null;
      return;
    }

    const targetElement = event?.target as HTMLElement;
    const rect = targetElement?.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(
      '.shortcuts_icon'
    ) as HTMLElement;

    if (shortcutsIcon && rect) {
      shortcutsIcon.style.top = `${
        rect.top + window.scrollY + targetElement.offsetHeight
      }px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }

    this.selectedIdCard = this.selectedIdCard === id ? null : id;
    this.selectedId = this.selectedId === id ? null : id;
  }

  openShoppingDetailsModal(modal: any, shopping: any) {
    if (this.isMobileView) {
      this.openCustomPanel(shopping);
    } else {
      this.currentShopping = shopping;
      this.modalService
        .open(modal, {
          windowClass: 'tiktok-modal',
          size: 'xl',
          animation: true,
          centered: true,
          scrollable: true,
          backdrop: true,
          keyboard: true,
          backdropClass: 'tiktok-backdrop',
        })
        .result.then(
          () => {
            this.currentShopping = null;
          },
          () => {
            this.currentShopping = null;
          }
        );
    }
  }

  private setupGlobalClickListener(): void {
    this.ngZone.runOutsideAngular(() => {
      const clickListener = this.renderer.listen(
        'document',
        'click',
        (event: Event) => {
          const target = event.target as HTMLElement;
          const commentsContainer = this.commentsContainer?.nativeElement;
          const isInsideComments = commentsContainer?.contains(target);
          const isInputFocused =
            target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
          const isClickOnLikeOrPhoto =
            target.classList.contains('like-button') ||
            target.classList.contains('photo');

          if (isInsideComments || isInputFocused || isClickOnLikeOrPhoto) {
            return;
          }

          this.ngZone.run(() => {
            this.hideAllComments();
            this.cdr.markForCheck();
          });
        }
      );

      this.globalClickListeners.push(clickListener);
    });
  }

  private setupScrollListener(): void {
    if (!this.scrollContainer?.nativeElement) return;

    this.ngZone.runOutsideAngular(() => {
      const scrollHandler = () => {
        this.ngZone.run(() => {
          this.hideAllDetails();
          this.cdr.markForCheck();
        });
      };

      const scrollSub = fromEvent(this.scrollContainer.nativeElement, 'scroll')
        .pipe(debounceTime(200), takeUntil(this.destroy$))
        .subscribe(scrollHandler);

      this.subscriptions.add(scrollSub);
    });
  }

  // Fix for the handleContentDoubleClick method
  handleContentDoubleClick(event: MouseEvent, shopping: Center): void {
    console.log('Double click detected'); // Add this for debugging
    const clickTime = new Date().getTime();
    const timeDiff = clickTime - this.lastClickTime;

    if (timeDiff < this.DOUBLE_CLICK_THRESHOLD) {
      // This is a double click
      event.preventDefault();
      event.stopPropagation();

      // Set heart position - adjust to be relative to viewport
      this.heartX = event.clientX;
      this.heartY = event.clientY;

      console.log('Heart position:', this.heartX, this.heartY); // Add this for debugging

      // Show heart animation
      this.showHeartAnimation();

      // Add like
      this.addLike(shopping, 1);

      // Reset click time
      this.lastClickTime = 0;
    } else {
      // This is a first click
      this.lastClickTime = clickTime;
    }
  }
  showHeartAnimation(): void {
    // Use NgZone to ensure animations run smoothly
    this.ngZone.run(() => {
      // Clear any existing timeout to prevent conflicts
      if (this.heartTimeout) {
        clearTimeout(this.heartTimeout);
        this.heartTimeout = null;
      }

      // Hide any existing heart first (if visible) to ensure clean animation
      this.heartVisible = false;

      // Force immediate update before showing new heart
      this.cdr.detectChanges();

      // Small delay before showing new heart to ensure DOM is ready
      setTimeout(() => {
        // Show the heart
        this.heartVisible = true;
        this.cdr.detectChanges();

        // Hide the heart after animation completes
        this.heartTimeout = setTimeout(() => {
          this.heartVisible = false;
          this.cdr.detectChanges();
        }, 3000); // Match animation duration
      }, 10);
    });
  }
}
