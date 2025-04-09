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
import {
  trigger,
  style,
  animate,
  transition,
  keyframes,
} from '@angular/animations';
import { Subscription } from 'rxjs';

declare const google: any;
@Component({
  selector: 'app-social-view',
  templateUrl: './social-view.component.html',
  styleUrls: ['./social-view.component.css'],
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
  @ViewChild('commentsContainer') commentsContainer: ElementRef | undefined;
  @ViewChild('carousel') carousel!: NgbCarousel;
  // @ViewChild('carousel', { read: ElementRef }) carouselElement!: ElementRef;
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
  filteredCenters: Center[] = []; 
  searchQuery: string = '';
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
  // isOpen = false;
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
  feedbackNote: string = '';
  feedbackSubmitted: boolean = false;
  feedbackData: any[] = [];
  viewedCenters: Set<number> = new Set();
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private globalClickListenerr!: () => void;
  private isOptionSelected = false;
  private categoryNameCache = new Map<number, string>();
  private unitSizeCache = new Map<string, string>();
  private commentSortCache = new WeakMap<any[], any[]>();
  @ViewChild('panelContent') panelContent!: ElementRef;
  heartVisible = false;
  heartX = 0;
  heartY = 0;
  private heartTimeout: any;
  private lastClickTime = 0;
  private readonly DOUBLE_CLICK_THRESHOLD = 300; // ms
  
  // Loading state for skeleton
  isLoading = true;
  // Interval for hiding spinner
       
  private subscriptions = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
        
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

  // Method to hide spinner
  private hideSpinner(): void {
    try {
           
    } catch (error) {
      // Ignore errors
    }
  }

  async initializeData() {
    try {
      this.isLoading = true; // Show skeleton
        // Hide any spinner
      
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.stateService.setShoppingCenters(this.shoppingCenters);
      this.filteredCenters = this.shoppingCenters;


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
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
        // Make sure spinner is hidden
      this.cdr.detectChanges();
    }
  }

  filterCenters() {
    if (this.searchQuery.trim()) {
      this.filteredCenters = this.shoppingCenters.filter((center) =>
        center.CenterName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredCenters = this.shoppingCenters; 
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

    this.subscriptions.unsubscribe();
    
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

    this.removeGlobalTouchListeners();

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

    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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

        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      }
    });
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

    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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

        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      }
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
        this.open(likeTpl, shopping);
        this.clickTimeout = null;
      }, 250);
    }
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem('ContactId');
    if (!contactIdStr) {
      return;
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : '0', 10);

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some(
        (reaction: Reaction) => reaction.ContactId === contactId
      )
    ) {
      return;
    }

    if (this.isLikeInProgress) {
      return;
    }

    this.isLikeInProgress = true;
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.isLikeInProgress = false;
      },
      complete: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.isLikeInProgress = false;
        this.cdr.markForCheck();
      },
    });
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1;
  }

  trackByShoppingId(item: any): number {
    return item.Id;
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index;
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
              this.showDetails.fill(false);
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
            this.showDetails.fill(false);
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

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768;
    this.cdr.detectChanges();
  }

  openCustomPanel(shopping: any): void {
      // Hide spinner before opening panel
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

  // Fix for the handleContentDoubleClick method
  handleContentDoubleClick(event: MouseEvent, shopping: Center): void {
    const clickTime = new Date().getTime();
    const timeDiff = clickTime - this.lastClickTime;

    if (timeDiff < this.DOUBLE_CLICK_THRESHOLD) {
      // This is a double click
      event.preventDefault();
      event.stopPropagation();

      // Set heart position - adjust to be relative to viewport
      this.heartX = event.clientX;
      this.heartY = event.clientY;

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

        this.heartTimeout = setTimeout(() => {
          this.heartVisible = false;
          this.cdr.detectChanges();
        }, 3000);
      }, 10);
    });
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {})
      .catch((err) => {});
  }

  openLink(content: any, modalObject?: any) {
      // Hide spinner before opening modal
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
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
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
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      }
    });
  }

  openAddContactModal(content: any): void {
      // Hide spinner before opening modal
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
      this.isLoading = true; // Show skeleton
        // Hide any spinner
      
      await this.viewManagerService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete!
      );
      this.modalService.dismissAll();
    } catch (error) {
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
        // Make sure spinner is hidden
      this.cdr.markForCheck();
    }
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

  async openMapViewPlace(content: any, modalObject?: any) {
      // Hide spinner before opening modal
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
      return;
    }
    
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;

    if (!mapDiv) {
      this.isLoading = false; // Hide skeleton
        // Make sure spinner is hidden
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
    
    this.isLoading = false; // Hide skeleton
      // Make sure spinner is hidden
  }

  openStreetViewPlace(content: any, modalObject?: any) {
      // Hide spinner before opening modal
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

    this.isLoading = true; // Show skeleton
      // Hide any spinner

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
        // Handle error
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
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
      // Handle error
    }
    this.isLoading = false; // Hide skeleton
      // Make sure spinner is hidden
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
      // Hide spinner before opening modal
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  openContactsModal(content: any): void {
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.modalService.open(content, {
          size: 'lg',
          centered: true,
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      }
    });
  }

  openGallery(shpping: number) {
      // Hide spinner before opening gallery
    this.GetPlaceDetails(0, shpping);
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
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
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      }
    });
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
    this.viewManagerService
      .restoreShoppingCenter(MarketSurveyId, Deleted)
      .then(() => {
        const marketSurveyIdNum = Number(MarketSurveyId);

        this.shoppingCenters = this.shoppingCenters.map((center) => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        this.cdr.markForCheck();
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      })
      .catch(() => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      });
  }

  selectRating(rating: string): void {
    this.selectedRating = rating;
    this.cdr.markForCheck();
  }

  selectCenterAndContinue(selectedCenter: any, modal: any): void {
    if (!selectedCenter) return;

    this.selectedCenterId = selectedCenter.Id;

    if (this.selectedRating) {
      this.submitFeedback(modal, false);
    } else {
      this.updateComparisonView(selectedCenter);
    }
  }

  updateComparisonView(selectedCenter: any): void {
    this.viewedCenters.add(selectedCenter.Id);

    this.General.modalObject = selectedCenter;

    this.loadNextComparisonCenter();

    this.selectedRating = null;
    this.feedbackNote = '';

    this.cdr.markForCheck();
  }

  loadNextComparisonCenter(): void {
    const availableCenters = this.shoppingCenters.filter(
      (center) =>
        !this.viewedCenters.has(center.Id) &&
        center.Id !== this.General.modalObject.Id
    );

    if (availableCenters.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCenters.length);
      this.General.comparisonObject = availableCenters[randomIndex];
    } else {
      this.General.comparisonObject = null;
    }
  }

  skipComparison(modal: any): void {
    if (!this.General.comparisonObject) return;

    this.updateComparisonView(this.General.comparisonObject);
  }

  submitFeedback(modal: any, closeModal: boolean = true): void {
    if (!this.selectedRating) {
      return;
    }

    const feedback = {
      id: Date.now(), // Temporary ID until API integration
      centerId: this.selectedCenterId || this.General.modalObject.Id,
      rating: this.selectedRating,
      note: this.feedbackNote || '',
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('ContactId') || 'anonymous',
    };

    this.feedbackData.push(feedback);

    this.feedbackSubmitted = true;

    if (this.selectedRating === 'like') {
      const shopping = this.shoppingCenters.find(
        (s) => s.Id === feedback.centerId
      );
      if (shopping) {
        this.addLike(shopping, 1);
      }
    }

    if (closeModal) {
      this.resetFeedbackForm();

      modal.close();
    } else {
      const selectedCenter = this.shoppingCenters.find(
        (s) => s.Id === feedback.centerId
      );
      if (selectedCenter) {
        this.updateComparisonView(selectedCenter);
      }
    }
  }

  resetFeedbackForm(): void {
    this.selectedRating = null;
    this.selectedCenterId = null;
    this.feedbackNote = '';
    this.feedbackSubmitted = false;
    this.viewedCenters.clear();
    this.cdr.markForCheck();
  }

  open(content: any, currentShopping: any) {
      // Hide spinner before opening modal
    this.resetFeedbackForm();
    this.General.modalObject = currentShopping;
    this.viewedCenters.add(currentShopping.Id);
    this.loadNextComparisonCenter();
    this.modalService.open(content, {
      windowClass: 'custom-modal',
    });
  }
}