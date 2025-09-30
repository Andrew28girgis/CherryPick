import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center, Reaction } from 'src/app/shared/models/shoppingCenters';
import { StateService } from 'src/app/core/services/state.service';
import { PlacesService } from 'src/app/core/services/places.service';

import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { AuthService } from 'src/app/core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-social-media-view',
  templateUrl: './social-media-view.component.html',
  styleUrls: ['./social-media-view.component.css'],
})
export class SocialMediaViewComponent implements OnInit {
  General: any = {};
  shoppingCenters: Center[] = [];
  buyboxCategories: BuyboxCategory[] = [];
  // BuyBoxId!: any;
  buyboxPlaces: BbPlace[] = [];
  globalClickListener!: (() => void)[];
  showComments: { [key: number]: boolean } = {};
  newComments: { [key: number]: string } = {};
  replyingTo: { [key: number]: number | null } = {};
  isLikeInProgress = false;
  likedShoppings: { [key: number]: boolean } = {};
  selectedRating: string | null = null;
  clickTimeout: any;
  showDetails: boolean[] = [];
  OrgId!: any;
  Guid!: string;
  GuidLink!: string;
  selectedIdCard: number | null = null;
  CustomPlace!: LandingPlace;
  ShoppingCenter!: any;
  placeImage: string[] = [];
  selectedId: number | null = null;
  mapViewOnePlacex: boolean = false;
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  newReplies: { [key: number]: string } = {};
  currentView: any;
  isMobileView!: boolean;
  selectedCenterId: number | null = null;
  currentIndex = -1;
  returnedEmail!: any;
  returnedPassword!: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('commentsContainer') commentsContainer: ElementRef | undefined;
  @ViewChild('loginRegisterModal', { static: true }) loginRegisterModal: any;
  @ViewChild('ShareWithContact', { static: true }) ShareWithContact: any;
  @ViewChild('galleryModal', { static: true }) galleryModal: any;
  @ViewChild('addContactModal', { static: true }) addContactModal: any;
  campaignId!: any;
  loginSharedToken!: any;
  selectedMarketSurveyId: number | null = null;

  private key = CryptoJS.enc.Utf8.parse('YourSecretKey123YourSecretKey123');
  private iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  formData = {
    FirstName: '',
    LastName: '',
    OrganizationId: null,
    CampaignId: null,
    email: '',
    password: '',
  };
  constructor(
    private stateService: StateService,
    private PlacesService: PlacesService,
    private renderer: Renderer2,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    public activatedRoute: ActivatedRoute,
    private readonly placesService: PlacesService,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      // this.BuyBoxId = params.buyBoxId;
      this.OrgId = params.orgId;
      this.campaignId = params.campaignId;
      this.currentView = localStorage.getItem('currentView') || '2';
      this.loginSharedToken = localStorage.getItem('loginToken');
    });

    this.currentView = this.isMobileView ? '5' : '2';
    this.BuyBoxPlacesCategories();
  }
  encrypt(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value),
      this.key,
      {
        keySize: 256 / 8,
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encrypted.toString();
  }
  handleShoppingCenterLike(shoppingCenter: Center, reactionId: number): void {
    if (!this.loginSharedToken) {
      return;
    }
      if (this.isTokenReturned()) {
      this.onShoppingCenterSelect(shoppingCenter);
      this.updatePlaceKanbanStage();
      return;
    }
  
    // Proceed with the like action
    this.onShoppingCenterSelect(shoppingCenter);
    this.addLike(shoppingCenter, reactionId);
  }
  addLike(shopping: Center, reactionId: number): void {
    if (this.loginSharedToken) {
      this.modalService.open(this.addContactModal, { centered: true });
      return;
    }

    if (!this.isUserLoggedIn()) {
      this.openLoginModal();
      return;
    }

    const contactIdStr = localStorage.getItem('contactId');
    if (!contactIdStr) {
      return;
    }
    const contactId = parseInt(contactIdStr, 10);

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
    const isLiked = this.likedShoppings[shopping.MarketSurveyId];

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = [];
    }

    if (!isLiked) {
      shopping.ShoppingCenter.Reactions.length++;
      this.likedShoppings[shopping.MarketSurveyId] = true;
    }

    this.cdr.detectChanges();

    this.isLikeInProgress = false;
    this.cdr.detectChanges();
  }
  submitAddContactForm(modal: any): void {
    const encryptedPassword = this.encrypt(this.formData.password);
    const body = {
      Name: 'AddContactToOrganization',
      Params: {
        FirstName: this.formData.FirstName,
        LastName: this.formData.LastName,
        OrganizationId: +this.OrgId,
        CampaignId: +this.campaignId,
        email: this.formData.email,
        password: encryptedPassword,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res) => {
        this.showToast('Contact successfully added!');
        this.onSubmit();
        modal.close();
        this.resetForm();
      },
    });
  }
  onShoppingCenterSelect(shoppingCenter: Center): void {
    this.selectedMarketSurveyId = shoppingCenter.MarketSurveyId;
  }
  updatePlaceKanbanStage(): void {
    const body = {
      Name: 'UpdatePlaceKanbanStage',
      Params: {
        MarketSurveyId: this.selectedMarketSurveyId,
        StageId: 446,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
        
      },
    });
  }


  public onSubmit(): void {
    const loginRequest = {
      Email: this.formData.email,
      Password: this.encrypt(this.formData.password),
    };

    this.placesService.loginUser(loginRequest).subscribe({
      next: (response: any) => {
        this.handleLoginSuccess(response);
        this.updatePlaceKanbanStage();
      },
    });
  }

  private handleLoginSuccess(response: any): void {
    if (response?.token) {
      this.authService.setToken(response.token);
      // Optionally you can add any further logic after successful login
    } else {
      console.error('Token not found in the response.');
      this.showToast('Login failed. Please try again.');
    }
  }

  private handleLoginError(error: any): void {
    console.error('Login failed:', error);
    this.showToast('Something went wrong. Please try again.');
  }
  resetForm(): void {
    this.formData = {
      FirstName: '',
      LastName: '',
      OrganizationId: null,
      CampaignId: null,
      email: '',
      password: '',
    };
  }

  BuyBoxPlacesCategories(): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters();
      return;
    }
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters();
      },
    });
  }
  getShoppingCenters(): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.getBuyBoxPlaces(this.campaignId);
      return;
    }

    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        CampaignId: this.campaignId,
        ShoppingCenterStageId: 0, // Load all centers

      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.shoppingCenters = this.shoppingCenters?.sort((a, b) =>
          a.CenterCity.localeCompare(b.CenterCity)
        );
        this.shoppingCenters = this.shoppingCenters?.filter(
          (element: any) => element.Deleted == false
        );
        this.shoppingCenters = this.shoppingCenters?.filter((element: any) =>
          [42, 44].includes(element.kanbanTemplateStageId)
        );

        this.stateService.setShoppingCenters(this.shoppingCenters);

        this.getBuyBoxPlaces(this.campaignId);
      },
    });
  }
  getBuyBoxPlaces(campaignId: number): void {
    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        CampaignId: campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories?.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
      },
    });
  }
  scrollUp() {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: -cardHeight,
      behavior: 'smooth',
    });
  }

  scrollDown() {
    const container = this.scrollContainer.nativeElement;
    const cardHeight = container.querySelector('.card')?.clientHeight || 0;
    container.scrollBy({
      top: cardHeight,
      behavior: 'smooth',
    });
  }

  ngAfterViewInit(): void {
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
        this.hideAllComments();
      })
    );
  }

  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false;
    }
  }

  trimComment(value: string, marketSurveyId: number): void {
    if (value) {
      this.newComments[marketSurveyId] = value.trimLeft();
    } else {
      this.newComments[marketSurveyId] = '';
    }
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1;
  }

  open(content: any, currentShopping: any, nextShopping: any) {
    this.modalService.open(content, {
      windowClass: 'custom-modal',
    });
    this.General.modalObject = currentShopping;
    this.General.nextModalObject = nextShopping;
  }

  rate(rating: 'dislike' | 'neutral' | 'like') {
    this.selectedRating = rating;
  }

  // handleClick(shopping: any, likeTpl: TemplateRef<any>, index: number): void {
  //   if (this.clickTimeout) {
  //     clearTimeout(this.clickTimeout);
  //     this.clickTimeout = null;
  //     this.addLike(shopping, 1);
  //   } else {
  //     this.clickTimeout = setTimeout(() => {
  //       const nextShopping = this.getNextShopping(index);
  //       this.open(likeTpl, shopping, nextShopping);
  //       this.clickTimeout = null;
  //     }, 250);
  //   }
  // }
  getNextShopping(currentIndex: number): any {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      const nextIndex = (currentIndex + 1) % this.shoppingCenters.length;
      return this.shoppingCenters[nextIndex];
    }
    return null;
  }
  openLoginModal(): void {
    this.modalService.open(this.loginRegisterModal, {
      ariaLabelledBy: 'modal-login-register',
      centered: true,
      scrollable: true,
    });
  }
  isUserLoggedIn(): boolean {
    const contactId = localStorage.getItem('contactId');
    return contactId !== null && contactId !== 'undefined';
  }
  isTokenReturned(): boolean {
    const token = this.authService.getToken();
    return token !== null && token !== undefined;
  }
  
  toggleDetails(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index];
    }
  }
  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };
    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice; // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;
      return `
          <div style="display:inline-block; text-align:left; line-height:1.2;">
            <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
            <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
          </div>
        `;
    };
    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    if (buildingSizes.length === 0) {
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const resultPrice =
          leasePrice && leasePrice !== 'On Request'
            ? appendInfoIcon(
                `$${formatNumberWithCommas(
                  Math.floor((parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        return `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
      return null;
    }
    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);
    const minPrice =
      places.find((place: any) => place.BuildingSizeSf === minSize)
        ?.ForLeasePrice || 'On Request';
    const maxPrice =
      places.find((place: any) => place.BuildingSizeSf === maxSize)
        ?.ForLeasePrice || 'On Request';
    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(
            maxSize
          )} sq ft.`;

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(maxPrice) * maxSize) / 12)
            )}/month`,
            maxPrice
          );
    let leasePriceRange;
    if (
      formattedMinPrice === 'On Request' &&
      formattedMaxPrice === 'On Request'
    ) {
      leasePriceRange = 'On Request';
    } else if (formattedMinPrice === 'On Request') {
      leasePriceRange = formattedMaxPrice;
    } else if (formattedMaxPrice === 'On Request') {
      leasePriceRange = formattedMinPrice;
    } else if (formattedMinPrice === formattedMaxPrice) {
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

 
  toggleComments(shopping: any, event: MouseEvent): void {
    event.stopPropagation();

    // If loginSharedToken exists, show modal and exit early
    if (this.loginSharedToken) {
      this.modalService.open(this.addContactModal, { centered: true });
      return;
    }

    if (!this.isUserLoggedIn()) {
      this.openLoginModal();
      return;
    }

    this.showComments[shopping.Id] = !this.showComments[shopping.Id];
  }

  // OpenShareWithContactModal(content: any): void {
  //   const body: any = {
  //     Name: 'GetBuyBoxGUID',
  //     Params: {
  //       BuyBoxId: +this.BuyBoxId,
  //       OrganizationId: +this.OrgId,
  //     },
  //   };
  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       this.Guid = data.json[0].buyBoxLink;
  //       if (this.Guid) {
  //         this.GuidLink = `https://cp.cherrypick.com/?t=${this.Guid}`;
  //       } else {
  //         this.GuidLink = '';
  //       }
  //     },
  //   });
  //   this.modalService.open(this.ShareWithContact, { size: 'lg' });
  // }
 
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
        CampaignId: this.campaignId,
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
      },
    });
  }
 
  copyGUID(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        this.showToast('Tenant Link Copied to Clipboard!');
        this.modalService.dismissAll();
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
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
    if (!lat || !lng) {
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;
    if (!mapDiv) {
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
  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  viewOnStreet() {
    this.StreetViewOnePlace = true;
    let lat = +this.General.modalObject.StreetLatitude;
    let lng = +this.General.modalObject.StreetLongitude;
    let heading = this.General.modalObject.Heading || 165;
    let pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
      }
    });
  }
  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 }, // Dynamic heading and pitch
          zoom: 1,
        }
      );
      // this.addMarkerToStreetView(panorama, lat, lng);
    } else {
    }
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
        // identity: this.ContactId,
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
      },
    });
  }
  sortCommentsByDate(comments: any[]): any[] {
    return comments?.sort(
      (a, b) =>
        new Date(b.CommentDate).getTime() - new Date(a.CommentDate).getTime()
    );
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
        // identity: this.ContactId
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
      },
    });
  }
  toggleReply(shopping: any, commentId: number): void {
    if (!this.replyingTo[shopping.MarketSurveyId]) {
      this.replyingTo[shopping.MarketSurveyId] = null;
    }

    this.replyingTo[shopping.MarketSurveyId] =
      this.replyingTo[shopping.MarketSurveyId] === commentId ? null : commentId;
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
    }
  }
}
