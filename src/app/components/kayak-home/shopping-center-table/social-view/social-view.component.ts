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
  ChangeDetectionStrategy,
   NgZone,
} from "@angular/core"
import  { ActivatedRoute, Router } from "@angular/router"
import  { NgxSpinnerService } from "ngx-spinner"
import  { NgbCarousel, NgbModal } from "@ng-bootstrap/ng-bootstrap"
import  { MapsService } from "src/app/services/maps.service"
import  { BuyboxCategory } from "src/models/buyboxCategory"
import  { Center, Reaction } from "../../../../../models/shoppingCenters"
import  { StateService } from "../../../../services/state.service"
import  { ShareOrg } from "src/models/shareOrg"
import  { LandingPlace } from "src/models/landingPlace"
import  { NgForm } from "@angular/forms"
import  { BbPlace } from "src/models/buyboxPlaces"
import  { ViewManagerService } from "src/app/services/view-manager.service"
import { General } from "src/models/domain"
import  { SafeResourceUrl, DomSanitizer } from "@angular/platform-browser"
import  { PlacesService } from "src/app/services/places.service"
import { forkJoin, of } from "rxjs"
import { catchError, finalize } from "rxjs/operators"
declare const google: any;
@Component({
  selector: "app-social-view",
  templateUrl: "./social-view.component.html",
  styleUrls: ["./social-view.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush change detection for better performance
})
export class SocialViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("scrollContainer") scrollContainer!: ElementRef
  @ViewChild("commentsContainer") commentsContainer: ElementRef | undefined
  @ViewChild("carousel") carousel!: NgbCarousel
  @ViewChild("carousel", { read: ElementRef }) carouselElement!: ElementRef
  @ViewChild("galleryModal", { static: true }) galleryModal: any
  @ViewChild("contactsModal", { static: true }) contactsModalTemplate: any

  General: General = new General()
  BuyBoxId!: any
  OrgId!: any
  BuyBoxName!: string
  dropdowmOptions: any[]
  selectedOption = 5
  buyboxCategories: BuyboxCategory[] = []
  shoppingCenters: Center[] = []
  selectedIdCard: number | null = null
  placeImage: string[] = []
  replyingTo: { [key: number]: number | null } = {}
  newComments: { [key: number]: string } = {}
  newReplies: { [key: number]: string } = {}
  showComments: { [key: number]: boolean } = {}
  showDetails: boolean[] = []
  likedShoppings: { [key: number]: boolean } = {}
  isLikeInProgress = false
  clickTimeout: any
  sanitizedUrl!: SafeResourceUrl
  isOpen = false
  currentView: any
  mapViewOnePlacex = false
  StreetViewOnePlace!: boolean
  selectedState = "0"
  selectedCity = ""
  activecomponent = "Properties"
  selectedTab = "Properties"
  ShareOrg: ShareOrg[] = []
  selectedCenterId: number | null = null
  currentIndex = -1
  selectedRating: string | null = null
  CustomPlace!: LandingPlace
  ShoppingCenter!: any
  globalClickListener!: (() => void)[]
  shareLink: any
  newContact: any = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  }
  OrganizationContacts: any[] = []
  private touchStartX = 0
  private touchEndX = 0
  private readonly SWIPE_THRESHOLD = 50
  shoppingCenterIdToDelete: number | null = null
  deleteShoppingCenterModal!: TemplateRef<any>
  buyboxPlaces: BbPlace[] = []
  showbackIds: number[] = []

  // Flag to control when to load maps
  mapsLoaded = false

  // Cache for expensive calculations
  private categoryNameCache = new Map<number, string>()
  private unitSizeCache = new Map<string, string>()

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private PlacesService: PlacesService,
    private viewManagerService: ViewManagerService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
  ) {
    this.dropdowmOptions = this.viewManagerService.dropdowmOptions
  }

  ngOnInit(): void {
    this.General = new General()
    this.selectedState = ""
    this.selectedCity = ""
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.BuyBoxName = params.buyboxName
      localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.OrgId)

      // Initialize data after getting params
      this.initializeData()
    })

    this.currentView = localStorage.getItem("currentViewDashBord") || "5"

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView),
    )

    if (selectedOption) {
      this.selectedOption = selectedOption.status
    }
    this.activecomponent = "Properties"
    this.selectedTab = "Properties"

    // Defer loading of maps until needed
    setTimeout(() => {
      this.mapsLoaded = true
      this.cdr.markForCheck()
    }, 2000)
  }

  async initializeData() {
    try {
      this.spinner.show()

      // Use forkJoin to fetch data in parallel
      forkJoin({
        categories: this.viewManagerService.getBuyBoxCategories(this.BuyBoxId),
        centers: this.viewManagerService.getShoppingCenters(this.BuyBoxId),
        org: this.viewManagerService.getOrganizationById(this.OrgId),
        places: this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId),
      })
        .pipe(
          catchError((error) => {
            console.error("Error initializing data:", error)
            return of({
              categories: [],
              centers: [],
              org: [],
              places: [],
            })
          }),
          finalize(() => {
            this.spinner.hide()
            this.cdr.markForCheck() // Trigger change detection after data is loaded
          }),
        )
        .subscribe((result) => {
          this.buyboxCategories = result.categories
          this.shoppingCenters = result.centers
          this.ShareOrg = result.org
          this.buyboxPlaces = result.places

          this.buyboxCategories.forEach((category) => {
            category.isChecked = false
            category.places = this.buyboxPlaces?.filter((place) =>
              place.RetailRelationCategories?.some((x) => x.Id === category.id),
            )
          })
        })
    } catch (error) {
      console.error("Error initializing data:", error)
      this.spinner.hide()
    }
  }

  ngAfterViewInit(): void {
    // Use NgZone.runOutsideAngular for event listeners to avoid change detection cycles
    this.ngZone.runOutsideAngular(() => {
      const events = ["click", "wheel", "touchstart"]
      this.globalClickListener = events.map((eventType) =>
        this.renderer.listen("document", eventType, (event: Event) => {
          const target = event.target as HTMLElement
          const commentsContainer = this.commentsContainer?.nativeElement
          const isInsideComments = commentsContainer?.contains(target)
          const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA"
          const isClickOnLikeOrPhoto = target.classList.contains("like-button") || target.classList.contains("photo")
          if (isInsideComments || isInputFocused || isClickOnLikeOrPhoto) {
            return
          }

          // Run inside Angular zone when we need to update the UI
          this.ngZone.run(() => {
            this.hideAllComments()
            this.cdr.markForCheck()
          })
        }),
      )
    })
  }

  ngOnDestroy(): void {
    if (this.globalClickListener) {
      this.globalClickListener.forEach((listener) => listener())
    }

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
    }
  }

  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false
    }
  }

  scrollUp(): void {
    const container = this.scrollContainer.nativeElement
    const cardHeight = container.querySelector(".card")?.clientHeight || 0
    container.scrollBy({
      top: -cardHeight,
      behavior: "smooth",
    })
  }

  scrollDown(): void {
    const container = this.scrollContainer.nativeElement
    const cardHeight = container.querySelector(".card")?.clientHeight || 0
    container.scrollBy({
      top: cardHeight,
      behavior: "smooth",
    })
  }

  toggleDetails(index: number, shopping: any): void {
    if (shopping.ShoppingCenter?.BuyBoxPlaces) {
      this.showDetails[index] = !this.showDetails[index]
      this.cdr.markForCheck()
    }
  }

  // Memoized version of getNeareastCategoryName
  getNeareastCategoryName(categoryId: number): string {
    if (this.categoryNameCache.has(categoryId)) {
      return this.categoryNameCache.get(categoryId)!
    }

    const result = this.viewManagerService.getNearestCategoryName(categoryId, this.buyboxCategories)
    this.categoryNameCache.set(categoryId, result)
    return result
  }

  // Memoized version of getShoppingCenterUnitSize
  getShoppingCenterUnitSize(shoppingCenter: any): string {
    const key = `${shoppingCenter.Id}`
    if (this.unitSizeCache.has(key)) {
      return this.unitSizeCache.get(key)!
    }

    const result = this.viewManagerService.getShoppingCenterUnitSize(shoppingCenter)
    this.unitSizeCache.set(key, result)
    return result
  }

  toggleComments(shopping: any, event: MouseEvent): void {
    event.stopPropagation()
    this.showComments[shopping.Id] = !this.showComments[shopping.Id]
    this.cdr.markForCheck()
  }

  addComment(shopping: Center, marketSurveyId: number): void {
    if (!this.newComments[marketSurveyId]?.trim()) {
      return
    }

    const commentText = this.newComments[marketSurveyId]
    this.newComments[marketSurveyId] = ""

    const body = {
      Name: "CreateComment",
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        Comment: commentText,
        ParentCommentId: 0,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (!shopping.ShoppingCenter.Comments) {
          shopping.ShoppingCenter.Comments = []
        }

        shopping.ShoppingCenter.Comments.push({
          Comment: commentText,
          CommentDate: new Date().toISOString(),
        })

        shopping.ShoppingCenter.Comments = this.sortCommentsByDate(shopping.ShoppingCenter.Comments)

        this.cdr.markForCheck()
      },
      error: (error: any) => {
        this.newComments[marketSurveyId] = commentText
        console.error("Error adding comment:", error)
        this.cdr.markForCheck()
      },
    })
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
      console.error("Reply text is empty")
      return
    }

    const replyText = this.newReplies[commentId]
    this.newReplies[commentId] = ""

    const body = {
      Name: "CreateComment",
      Params: {
        MarketSurveyId: marketSurveyId,
        Comment: replyText,
        ParentCommentId: commentId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {
        this.replyingTo[marketSurveyId] = null

        const shoppingCenter = this.shoppingCenters.find((sc) => sc.MarketSurveyId === marketSurveyId)
        if (shoppingCenter && shoppingCenter.ShoppingCenter.Comments) {
          shoppingCenter.ShoppingCenter.Comments.push({
            Comment: replyText,
            CommentDate: new Date().toISOString(),
            ParentCommentId: commentId,
          })

          shoppingCenter.ShoppingCenter.Comments = this.sortCommentsByDate(shoppingCenter.ShoppingCenter.Comments)
        }

        this.cdr.markForCheck()
      },
      error: (error: any) => {
        console.error("Error adding reply:", error)
        this.newReplies[commentId] = replyText
        this.cdr.markForCheck()
      },
    })
  }

  // Memoize sortCommentsByDate with a WeakMap to avoid recalculating for the same array
  private commentSortCache = new WeakMap<any[], any[]>()

  sortCommentsByDate(comments: any[]): any[] {
    if (!comments) return []

    if (this.commentSortCache.has(comments)) {
      return this.commentSortCache.get(comments)!
    }

    const sorted = [...comments].sort((a, b) => new Date(b.CommentDate).getTime() - new Date(a.CommentDate).getTime())

    this.commentSortCache.set(comments, sorted)
    return sorted
  }

  toggleReply(shopping: any, commentId: number): void {
    if (!this.replyingTo[shopping.MarketSurveyId]) {
      this.replyingTo[shopping.MarketSurveyId] = null
    }

    this.replyingTo[shopping.MarketSurveyId] = this.replyingTo[shopping.MarketSurveyId] === commentId ? null : commentId

    this.cdr.markForCheck()
  }

  trimComment(value: string, marketSurveyId: number): void {
    if (value) {
      this.newComments[marketSurveyId] = value.trimLeft()
    } else {
      this.newComments[marketSurveyId] = ""
    }
  }

  handleClick(shopping: any, likeTpl: TemplateRef<any>, index: number): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
      this.clickTimeout = null
      this.addLike(shopping, 1)
    } else {
      this.clickTimeout = setTimeout(() => {
        const nextShopping = this.getNextShopping(index)
        this.open(likeTpl, shopping, nextShopping)
        this.clickTimeout = null
      }, 250)
    }
  }

  open(content: any, currentShopping: any, nextShopping: any) {
    this.modalService.open(content, {
      windowClass: "custom-modal",
    })
    this.General.modalObject = currentShopping
    this.General.nextModalObject = nextShopping
  }

  getNextShopping(currentIndex: number): any {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      const nextIndex = (currentIndex + 1) % this.shoppingCenters.length
      return this.shoppingCenters[nextIndex]
    }
    return null
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem("ContactId")
    if (!contactIdStr) {
      console.log("no contact id")
      // return;
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : "0", 10)

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some((reaction: Reaction) => reaction.ContactId === contactId)
    ) {
      console.log("liked before")
      return
    }

    if (this.isLikeInProgress) {
      return
    }

    console.log("adding like ")

    this.isLikeInProgress = true
    const isLiked = this.likedShoppings[shopping.MarketSurveyId]

    if (!shopping.ShoppingCenter.Reactions) {
      shopping.ShoppingCenter.Reactions = []
    }

    if (!isLiked) {
      shopping.ShoppingCenter.Reactions.length++
      this.likedShoppings[shopping.MarketSurveyId] = true
    }

    this.cdr.markForCheck()

    const body = {
      Name: "CreatePropertyReaction",
      Params: {
        MarketSurveyId: shopping.MarketSurveyId,
        ReactionId: reactionId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => {},
      error: (error) => {
        if (!isLiked) {
          // shopping.ShoppingCenter.Reactions.length--;
          // delete this.likedShoppings[shopping.MarketSurveyId];
        } else {
          shopping.ShoppingCenter.Reactions.length++
          this.likedShoppings[shopping.MarketSurveyId] = true
        }
        this.cdr.markForCheck()
      },
      complete: () => {
        this.isLikeInProgress = false
        this.cdr.markForCheck()
      },
    })
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1
  }

  selectOption(option: any): void {
    this.selectedOption = option.status
    this.currentView = option.status
    this.isOpen = false
    localStorage.setItem("currentViewDashBord", this.currentView)
    this.cdr.markForCheck()
  }

  toggleShortcutsCard(id: number | null): void {
    this.selectedIdCard = id
    this.cdr.markForCheck()
  }

  toggleShortcuts(id: number, close?: string): void {
    if (close === "close") {
      this.selectedIdCard = null
      this.cdr.markForCheck()
    }
  }

  // TrackBy function for ngFor performance optimization
  trackByShoppingId(index: number, item: any): number {
    return item.Id
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index
  }

  // Lazy load maps only when needed
  async openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })

    // Dynamically load Google Maps API if not already loaded
    if (!this.mapsLoaded) {
      this.mapsLoaded = true
    }

    this.viewOnMap(modalObject.Latitude, modalObject.Longitude)
  }


  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
    // Load Google Maps API libraries
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

    // Create a new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }




  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    this.General.modalObject = modalObject

    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL)
    } else {
      setTimeout(() => {
        this.viewOnStreet()
      }, 100)
    }
  }

  viewOnStreet() {
    this.StreetViewOnePlace = true
    const lat = +this.General.modalObject.StreetLatitude
    const lng = +this.General.modalObject.StreetLongitude
    const heading = this.General.modalObject.Heading || 165
    const pitch = this.General.modalObject.Pitch || 0

    setTimeout(() => {
      const streetViewElement = document.getElementById("street-view")
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch)
      } else {
        console.error("Element with id 'street-view' not found.")
      }
    })
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const panorama = this.viewManagerService.initializeStreetView("street-view", lat, lng, heading, pitch)
    if (!panorama) {
      console.error("Failed to initialize street view")
    }
    this.cdr.markForCheck()
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url)
    this.cdr.markForCheck()
  }

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenterId: any) {
    this.shoppingCenterIdToDelete = shoppingCenterId
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  openContactsModal(content: any): void {
    this.spinner.show()
    const body: any = {
      Name: "GetOrganizationContacts",
      Params: {
        organizationId: this.OrgId,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.OrganizationContacts = data.json
        } else {
          this.OrganizationContacts = []
        }
        this.spinner.hide()
        this.modalService.open(content, {
          size: "lg",
          centered: true,
        })
        this.cdr.markForCheck()
      },
      error: (error: any) => {
        console.error("Error fetching Organization Contacts:", error)
        this.spinner.hide()
        this.cdr.markForCheck()
      },
    })
  }

  openGallery(shpping: number) {
    this.GetPlaceDetails(0, shpping)
    this.modalService.open(this.galleryModal, { size: "xl", centered: true })
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: "GetShoppingCenterDetails",
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        buyboxid: this.BuyBoxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CustomPlace = data.json?.[0] || null
        this.ShoppingCenter = this.CustomPlace

        if (this.ShoppingCenter && this.ShoppingCenter.Images) {
          this.placeImage = this.ShoppingCenter.Images?.split(",").map((link: any) => link.trim())
        }
        this.cdr.markForCheck()
      },
    })
  }

  selectCenter(centerId: number): void {
    this.selectedCenterId = centerId
    const selectedIndex = this.shoppingCenters.findIndex((center) => center.Id === centerId)

    if (selectedIndex !== -1) {
      this.General.modalObject = this.shoppingCenters[selectedIndex]
      this.currentIndex = (this.currentIndex + 1) % this.shoppingCenters.length
      let nextIndex = (this.currentIndex + 1) % this.shoppingCenters.length
      while (nextIndex === selectedIndex) {
        nextIndex = (nextIndex + 1) % this.shoppingCenters.length
      }
      this.General.nextModalObject = this.shoppingCenters[nextIndex]
      this.cdr.markForCheck()
    }
  }

  rate(rating: "dislike" | "neutral" | "like") {
    this.selectedRating = rating
    console.log(`User rated: ${rating}`)
    this.cdr.markForCheck()
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.touches[0].clientX
  }

  onTouchEnd() {
    if (!this.carousel) return

    const swipeDistance = this.touchEndX - this.touchStartX
    if (Math.abs(swipeDistance) > this.SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        this.carousel.prev()
      } else {
        this.carousel.next()
      }
    }

    // Reset values
    this.touchStartX = 0
    this.touchEndX = 0
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log("Link copied to clipboard!")
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
      })
  }

  openLink(content: any, modalObject?: any) {
    this.shareLink = ""
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    if (modalObject) {
      if (modalObject.CenterAddress) {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.ShoppingCenter.Places[0].Id}/${modalObject.Id}/${this.BuyBoxId}`
      } else {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.Id}/0/${this.BuyBoxId}`
      }
    } else {
      this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/home/${this.BuyBoxId}/${this.OrgId}`
    }
    this.cdr.markForCheck()
  }

  addContact(form: NgForm): void {
    this.spinner.show()
    const body: any = {
      Name: "AddContactToOrganization",
      Params: {
        FirstName: this.newContact.firstName,
        LastName: this.newContact.lastName,
        OrganizationId: this.OrgId,
        email: this.newContact.email,
        password: this.newContact.password,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide()
        console.log("Contact added successfully:", data)
        this.newContact = {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        }
        form.resetForm()
        this.modalService.dismissAll()
        this.openContactsModal(this.contactsModalTemplate)
        this.cdr.markForCheck()
      },
      error: (error: any) => {
        console.error("Error adding contact:", error)
        this.spinner.hide()
        this.cdr.markForCheck()
      },
    })
  }

  openAddContactModal(content: any): void {
    this.newContact = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    }
    this.modalService.open(content, {
      ariaLabelledBy: "modal-add-contact",
      size: "lg",
      centered: true,
      scrollable: true,
    })
  }

  async deleteShCenter() {
    try {
      this.spinner.show()
      await this.viewManagerService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete!)
      this.modalService.dismissAll()
      await this.initializeData()
    } catch (error) {
      console.error("Error deleting shopping center:", error)
    } finally {
      this.spinner.hide()
      this.cdr.markForCheck()
    }
  }
}

