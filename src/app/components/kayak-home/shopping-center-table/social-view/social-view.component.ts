import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  Renderer2,
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
import { ViewManagerService } from 'src/app/shared/services/view-manager.service';
import { General } from 'src/app/shared/models/domain';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { PlacesService } from 'src/app/shared/services/places.service';
declare const google: any;
import { MapsService } from 'src/app/shared/services/maps.service';
import { StateService } from '../../../../shared/services/state.service';

@Component({
  selector: 'app-social-view',
  templateUrl: './social-view.component.html',
  styleUrls: ['./social-view.component.css'],
})
export class SocialViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('commentsContainer') commentsContainer: ElementRef | undefined;
  @ViewChild('carousel') carousel!: NgbCarousel;
  @ViewChild('carousel', { read: ElementRef }) carouselElement!: ElementRef;
  @ViewChild('galleryModal', { static: true }) galleryModal: any;
  @ViewChild('contactsModal', { static: true }) contactsModalTemplate: any;
  @ViewChild('MapViewPlace', { static: true }) MapViewPlace!: TemplateRef<any>;
  @ViewChild('StreetViewPlace', { static: true })
  @Output()
  viewChange = new EventEmitter<number>();
  isPanelOpen = false;
  currentShopping: any = null;
  panelStartY = 0;
  panelCurrentY = 0;
  documentTouchMoveListener: Function | null = null;
  documentTouchEndListener: Function | null = null;
  readonly PANEL_SWIPE_THRESHOLD = 100;
  isMobileView = false;
  StreetViewPlace!: TemplateRef<any>;
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
  clickTimeout: any;
  sanitizedUrl!: SafeResourceUrl;
  isOpen = false;
  mapViewOnePlacex = false;
  StreetViewOnePlace!: boolean;
  selectedState = '0';
  selectedCity = '';
  ShareOrg: ShareOrg[] = [];
  selectedCenterId: number | null = null;
  currentIndex = -1;
  selectedRating: string | null = null;
  CustomPlace!: LandingPlace;
  ShoppingCenter!: any;
  globalClickListener!: (() => void)[];
  shareLink: any;
  newContact: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  OrganizationContacts: any[] = [];
  shoppingCenterIdToDelete: number | null = null;
  deleteShoppingCenterModal!: TemplateRef<any>;
  buyboxPlaces: BbPlace[] = [];
  showbackIds: number[] = [];
  mapsLoaded = false;
  DeletedSC: any;
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private globalClickListenerr!: () => void;
  private isOptionSelected = false;
  private categoryNameCache = new Map<number, string>();
  private unitSizeCache = new Map<string, string>();
  private commentSortCache = new WeakMap<any[], any[]>();
  @ViewChild('panelContent') panelContent!: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private PlacesService: PlacesService,
    private viewManagerService: ViewManagerService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
    this.General = new General();
    this.selectedState = '';
    this.selectedCity = '';
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      this.initializeData();
    });

    setTimeout(() => {
      this.mapsLoaded = true;
      this.cdr.markForCheck();
    }, 2000);

    window.addEventListener('resize', this.checkMobileView.bind(this));
  }

  async initializeData() {
    try {
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.stateService.setShoppingCenters(this.shoppingCenters);

      this.buyboxCategories = await this.viewManagerService.getBuyBoxCategories(
        this.BuyBoxId
      );
      this.stateService.setBuyboxCategories(this.buyboxCategories);

      this.ShareOrg = await this.viewManagerService.getOrganizationById(
        this.OrgId
      );
      this.stateService.setShareOrg(this.ShareOrg);

      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(
        this.BuyBoxId
      );
      this.stateService.setBuyboxPlaces(this.buyboxPlaces);
    } catch (error) {
      console.error('Error initializing data:', error);
      this.spinner.hide();
    }
  }

  ngAfterViewInit(): void {
    this.setupGlobalClickListener();

    this.ngZone.runOutsideAngular(() => {
      const events = ['click', 'wheel', 'touchstart'];
      this.globalClickListener = events.map((eventType) =>
        this.renderer.listen('document', eventType, (event: Event) => {
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
        })
      );
    });
  }

  ngOnDestroy(): void {
    if (this.globalClickListener) {
      this.globalClickListenerr();
    }
    if (this.globalClickListener) {
      this.globalClickListener.forEach((listener) => listener());
    }

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    window.removeEventListener('resize', this.checkMobileView.bind(this));

    // Make sure to clean up any panel listeners
    this.removeGlobalTouchListeners();

    // Ensure body class is removed
    document.body.classList.remove('panel-open');
  }

  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false;
    }
  }

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

  toggleDetails(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index];
      this.cdr.markForCheck();
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

  toggleComments(shopping: any, event: MouseEvent): void {
    event.stopPropagation();
    this.showComments[shopping.Id] = !this.showComments[shopping.Id];
    this.cdr.markForCheck();
  }

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

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (!shopping.ShoppingCenter.Comments) {
          shopping.ShoppingCenter.Comments = [];
        }

        shopping.ShoppingCenter.Comments.push({
          Comment: commentText,
          CommentDate: new Date().toISOString(),
        });

        shopping.ShoppingCenter.Comments = this.sortCommentsByDate(
          shopping.ShoppingCenter.Comments
        );

        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.newComments[marketSurveyId] = commentText;
        console.error('Error adding comment:', error);
        this.cdr.markForCheck();
      },
    });
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
      console.error('Reply text is empty');
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

    this.PlacesService.GenericAPI(body).subscribe({
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
          });

          shoppingCenter.ShoppingCenter.Comments = this.sortCommentsByDate(
            shoppingCenter.ShoppingCenter.Comments
          );
        }

        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error adding reply:', error);
        this.newReplies[commentId] = replyText;
        this.cdr.markForCheck();
      },
    });
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

  toggleReply(shopping: any, commentId: number): void {
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

  handleClick(shopping: any, likeTpl: TemplateRef<any>, index: number): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.addLike(shopping, 1);
    } else {
      this.clickTimeout = setTimeout(() => {
        const nextShopping = this.getNextShopping(index);
        this.open(likeTpl, shopping, nextShopping);
        this.clickTimeout = null;
      }, 250);
    }
  }

  open(content: any, currentShopping: any, nextShopping: any) {
    this.modalService.open(content, {
      windowClass: 'custom-modal',
    });
    this.General.modalObject = currentShopping;
    this.General.nextModalObject = nextShopping;
  }

  getNextShopping(currentIndex: number): any {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      const nextIndex = (currentIndex + 1) % this.shoppingCenters.length;
      return this.shoppingCenters[nextIndex];
    }
    return null;
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem('ContactId');
    if (!contactIdStr) {
      console.log('no contact id');
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : '0', 10);

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some(
        (reaction: Reaction) => reaction.ContactId === contactId
      )
    ) {
      console.log('liked before');
      return;
    }

    if (this.isLikeInProgress) {
      return;
    }

    console.log('adding like ');

    this.isLikeInProgress = true;
    const isLiked = this.likedShoppings[shopping.MarketSurveyId];

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    if (!isLiked) {
      shopping.ShoppingCenter.Reactions.length++;
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

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {},
      error: (error) => {
        if (!isLiked) {
        } else {
          shopping.ShoppingCenter.Reactions.length++;
          this.likedShoppings[shopping.MarketSurveyId] = true;
        }
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isLikeInProgress = false;
        this.cdr.markForCheck();
      },
    });
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1;
  }

  trackByShoppingId(index: number, item: any): number {
    return item.Id;
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index;
  }

  async openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    if (!this.mapsLoaded) {
      this.mapsLoaded = true;
    }

    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;

    if (!mapDiv) {
      console.error('Element with ID "mappopup" not found.');
      return;
    }

    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    });
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }

  openStreetViewPlace(content: any, modalObject?: any) {
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
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
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
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cdr.markForCheck();
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

  openContactsModal(content: any): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationContacts',
      Params: {
        organizationId: this.OrgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
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
      error: (error: any) => {
        console.error('Error fetching Organization Contacts:', error);
        this.spinner.hide();
        this.cdr.markForCheck();
      },
    });
  }

  openGallery(shpping: number) {
    this.GetPlaceDetails(0, shpping);
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        buyboxid: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CustomPlace = data.json?.[0] || null;
        this.ShoppingCenter = this.CustomPlace;

        if (this.ShoppingCenter && this.ShoppingCenter.Images) {
          this.placeImage = this.ShoppingCenter.Images?.split(',').map(
            (link: any) => link.trim()
          );
        }
        this.cdr.markForCheck();
      },
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

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  }

  openLink(content: any, modalObject?: any) {
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

  addContact(form: NgForm): void {
    this.spinner.show();
    const body: any = {
      Name: 'AddContactToOrganization',
      Params: {
        FirstName: this.newContact.firstName,
        LastName: this.newContact.lastName,
        OrganizationId: this.OrgId,
        email: this.newContact.email,
        password: this.newContact.password,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
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
      error: (error: any) => {
        console.error('Error adding contact:', error);
        this.spinner.hide();
        this.cdr.markForCheck();
      },
    });
  }

  openAddContactModal(content: any): void {
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

  async deleteShCenter() {
    this.shoppingCenters = this.shoppingCenters.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x
    );

    try {
      this.spinner.show();
      await this.viewManagerService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete!
      );
      this.modalService.dismissAll();
    } catch (error) {
      console.error('Error deleting shopping center:', error);
    } finally {
      this.spinner.hide();
      this.cdr.markForCheck();
    }
  }

  private setupGlobalClickListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.globalClickListenerr = this.renderer.listen(
        'document',
        'click',
        (event: Event) => {
          if (this.isOptionSelected) {
            this.isOptionSelected = false;
            return;
          }

          const target = event.target as HTMLElement;
          const expandedDetails = document.querySelector(
            '.shopping-center-details.expanded'
          );
          const seeMoreBtn = document.querySelector('.see-more-btn');

          if (
            expandedDetails &&
            !expandedDetails.contains(target) &&
            seeMoreBtn &&
            !seeMoreBtn.contains(target)
          ) {
            this.ngZone.run(() => {
              this.hideAllDetails();
              this.cdr.markForCheck();
            });
          }
        }
      );
    });

    this.setupScrollListener();
  }

  private setupScrollListener(): void {
    this.ngZone.runOutsideAngular(() => {
      const scrollHandler = () => {
        if (!this.isOptionSelected) {
          this.ngZone.run(() => {
            this.hideAllDetails();
            this.cdr.markForCheck();
          });
        }
      };

      this.scrollContainer.nativeElement.addEventListener(
        'scroll',
        scrollHandler,
        { passive: true }
      );
    });
  }

  hideAllDetails(): void {
    this.showDetails.fill(false);
  }

  toggleDetailsMobile(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index];
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.spinner.show();
    this.viewManagerService
      .restoreShoppingCenter(MarketSurveyId, Deleted)
      .then((response: any) => {
        const marketSurveyIdNum = Number(MarketSurveyId);

        this.shoppingCenters = this.shoppingCenters.map((center) => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        this.cdr.markForCheck();
        this.spinner.hide();
      })
      .catch((error: any) => {
        console.error('Error restore shopping center :', error);
      });
  }

  async refreshShoppingCenters() {
    try {
      this.spinner.show();
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(
        this.BuyBoxId
      );

      this.showbackIds = [];
    } catch (error) {
      console.error('Error refreshing shopping centers:', error);
    } finally {
      this.spinner.hide();
    }
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768;
    this.cdr.detectChanges();
  }

  openCustomPanel(shopping: any): void {
    this.currentShopping = shopping;
    this.isPanelOpen = true;
    this.cdr.markForCheck();

    document.body.classList.add('panel-open');

    this.renderer.listen('document', 'click', (event: Event) => {
      const panelElement = this.panelContent?.nativeElement;
      if (
        panelElement &&
        !panelElement.contains(event.target) &&
        this.isPanelOpen
      ) {
        this.closeCustomPanel();
      }
    });
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

    this.documentTouchMoveListener = this.renderer.listen(
      'document',
      'touchmove',
      (e: TouchEvent) => {
        this.handlePanelTouchMove(e);
      }
    );

    this.documentTouchEndListener = this.renderer.listen(
      'document',
      'touchend',
      (e: TouchEvent) => {
        this.handlePanelTouchEnd(e);
      }
    );
  }

  handlePanelTouchMove(event: TouchEvent): void {
    this.panelCurrentY = event.touches[0].clientY;
    const deltaY = this.panelCurrentY - this.panelStartY;

    if (deltaY > 0) {
      event.preventDefault();
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
    if (this.documentTouchMoveListener) {
      this.documentTouchMoveListener();
      this.documentTouchMoveListener = null;
    }

    if (this.documentTouchEndListener) {
      this.documentTouchEndListener();
      this.documentTouchEndListener = null;
    }
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
          (result) => {
            this.currentShopping = null;
          },
          (reason) => {
            this.currentShopping = null;
          }
        );
    }
  }

  handleOptionClick(event: Event, option: any, shopping: any): void {
    // Stop event propagation to prevent panel from closing
    event.stopPropagation();

    // Execute the option's action
    option.action(shopping);
  }

  getMobileShortcutOptions(shopping: any): any[] {
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

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();

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
}
