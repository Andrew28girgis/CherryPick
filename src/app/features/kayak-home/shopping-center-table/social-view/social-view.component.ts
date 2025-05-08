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
} from "@angular/core"
import   { ActivatedRoute, Router } from "@angular/router"
import   { NgbCarousel, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap"
import   { BuyboxCategory } from "src/app/shared/models/buyboxCategory"
import   { Center, Reaction, Stage } from "../../../../shared/models/shoppingCenters"
import   { ShareOrg } from "src/app/shared/models/shareOrg"
import   { LandingPlace } from "src/app/shared/models/landingPlace"
import   { NgForm } from "@angular/forms"
import   { BbPlace } from "src/app/shared/models/buyboxPlaces"
import { General } from "src/app/shared/models/domain"
import   { SafeResourceUrl, DomSanitizer, SafeHtml } from "@angular/platform-browser"
import   { PlacesService } from "src/app/core/services/places.service"
import { trigger, style, animate, transition, keyframes } from "@angular/animations"
import { Subscription } from "rxjs"
import   { ViewManagerService } from "src/app/core/services/view-manager.service"

declare const google: any
@Component({
  selector: "app-social-view",
  templateUrl: "./social-view.component.html",
  styleUrls: ["./social-view.component.css"],
  animations: [
    trigger("heartAnimation", [
      transition(":enter", [
        animate(
          "3s cubic-bezier(0.17, 0.89, 0.32, 1.28)",
          keyframes([
            style({
              transform: "scale(0)",
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: "scale(1.2)",
              opacity: 0.9,
              offset: 0.15,
            }),
            style({
              transform: "scale(1)",
              opacity: 1,
              offset: 0.3,
            }),
            style({
              transform: "scale(1.1) translateY(-40px)",
              opacity: 1,
              offset: 0.5,
            }),
            style({
              transform: "scale(1) translateY(-80px)",
              opacity: 0.9,
              offset: 0.7,
            }),
            style({
              transform: "scale(0.8) translateY(-120px)",
              opacity: 0,
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class SocialViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("scrollContainer") scrollContainer!: ElementRef
  @ViewChild("commentsContainer") commentsContainer: ElementRef | undefined
  @ViewChild("carousel") carousel!: NgbCarousel
  @ViewChild("galleryModal", { static: true }) galleryModal: any
  @ViewChild("contactsModal", { static: true }) contactsModalTemplate: any
  @ViewChild("MapViewPlace", { static: true }) MapViewPlace!: TemplateRef<any>
  @ViewChild("panelContent") panelContent!: ElementRef
  @ViewChild("StreetViewPlace", { static: true })
  @Output()
  viewChange = new EventEmitter<number>()
  isPanelOpen = false
  currentShopping: any = null
  panelStartY = 0
  panelCurrentY = 0
  documentTouchMoveListener: Function | null = null
  documentTouchEndListener: Function | null = null
  readonly PANEL_SWIPE_THRESHOLD = 100
  isMobileView = false
  StreetViewPlace!: TemplateRef<any>
  General: General = new General()
  BuyBoxId!: any
  OrgId!: any
  BuyBoxName!: string
  buyboxCategories: BuyboxCategory[] = []
  shoppingCenters: Center[] = []
  filteredCenters: Center[] = []
  searchQuery = ""
  selectedIdCard: number | null = null
  selectedId: number | null = null
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
  mapViewOnePlacex = false
  StreetViewOnePlace!: boolean
  selectedState = "0"
  selectedCity = ""
  ShareOrg: ShareOrg[] = []
  selectedCenterId: number | null = null
  currentIndex = -1
  selectedRating: string | null = null
  CustomPlace!: LandingPlace
  ShoppingCenter!: any
  globalClickListener!: (() => void)[]
  shareLink: any
  selectedStageName = "All"
  stages: Stage[] = []
  selectedStageId = 0 // Default to 0 (All)
  allShoppingCenters: Center[] = [] // Store all shopping centers

  newContact: any = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  }
  OrganizationContacts: any[] = []
  shoppingCenterIdToDelete: number | null = null
  deleteShoppingCenterModal!: TemplateRef<any>
  buyboxPlaces: BbPlace[] = []
  showbackIds: number[] = []
  mapsLoaded = false
  DeletedSC: any
  feedbackNote = ""
  feedbackSubmitted = false
  feedbackData: any[] = []
  viewedCenters: Set<number> = new Set()

  heartVisible = false
  heartX = 0
  heartY = 0
  isLoading = true
  private touchStartX = 0
  private touchEndX = 0
  private readonly SWIPE_THRESHOLD = 50
  private globalClickListenerr!: () => void
  private isOptionSelected = false
  private commentSortCache = new WeakMap<any[], any[]>()
  private heartTimeout: any
  private lastClickTime = 0
  private readonly DOUBLE_CLICK_THRESHOLD = 300 // ms
  private subscriptions = new Subscription()
  @ViewChild("statusModal", { static: true }) statusModal!: TemplateRef<any>
  htmlContent!: SafeHtml
  private modalRef?: NgbModalRef
  isLoadingstatus = true
  submissions: any
  CampaignId!: any

  @ViewChild("submission", { static: true }) submissionModal!: TemplateRef<any>
  Campaign: any
  isSocialView = false
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private PlacesService: PlacesService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private shoppingCenterService: ViewManagerService,
  ) {}

  ngOnInit(): void {
    this.isSocialView = this.localStorage.getItem("currentViewDashBord") === "5"

    this.checkMobileView()
    this.General = new General()
    this.selectedState = ""
    this.selectedCity = ""

    // Subscribe to the selectedStageId from the service
    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id
        // Update the selected stage name for display
        if (id === 0) {
          this.selectedStageName = "All"
        } else {
          const stage = this.stages.find((s) => s.id === id)
          this.selectedStageName = stage ? stage.stageName : ""
        }
        this.cdr.detectChanges()
      }),
    )

    this.activatedRoute.params.subscribe((params: any) => {
      this.Campaign = params.campaign

      this.Campaign = params.campaign
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.BuyBoxName = params.buyboxName
      localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.OrgId)

      // this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);
    })

    // Subscribe to data from the centralized service
    this.subscriptions.add(
      this.shoppingCenterService.isLoading$.subscribe((loading) => {
        this.isLoading = loading
        this.cdr.detectChanges()
      }),
    )
    this.subscriptions.add(
      this.shoppingCenterService.allShoppingCenters$.subscribe((centers) => {
        this.allShoppingCenters = centers
        this.cdr.detectChanges()
      }),
    )
    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.buyboxCategories$.subscribe((categories) => {
        this.buyboxCategories = categories
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.shareOrg$.subscribe((org) => {
        this.ShareOrg = org
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.buyboxPlaces$.subscribe((places) => {
        this.buyboxPlaces = places
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.selectedId$.subscribe((id) => {
        this.selectedId = id
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.selectedIdCard$.subscribe((id) => {
        this.selectedIdCard = id
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.add(
      this.shoppingCenterService.searchQuery$.subscribe((query) => {
        this.searchQuery = query
        this.cdr.detectChanges()
      }),
    )

    setTimeout(() => {
      this.mapsLoaded = true
      this.cdr.markForCheck()
    }, 2000)

    window.addEventListener("resize", this.checkMobileView.bind(this))
  }

  filterCenters() {
    this.shoppingCenterService.filterCenters(this.searchQuery)
  }

  ngAfterViewInit(): void {
    this.setupGlobalClickListener()

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
          this.ngZone.run(() => {
            for (const key in this.showComments) {
              this.showComments[key] = false
            }
            this.cdr.markForCheck()
          })
        }),
      )
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()

    if (this.globalClickListener) {
      this.globalClickListenerr()
    }
    if (this.globalClickListener) {
      this.globalClickListener.forEach((listener) => listener())
    }

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
    }
    window.removeEventListener("resize", this.checkMobileView.bind(this))

    this.removeGlobalTouchListeners()

    document.body.classList.remove("panel-open")

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

  getNeareastCategoryName(categoryId: number): string {
    return this.shoppingCenterService.getNearestCategoryName(categoryId)
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.shoppingCenterService.getShoppingCenterUnitSize(shoppingCenter)
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

    this.isLoading = true
    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
        if (!shopping.ShoppingCenter.Comments) {
          shopping.ShoppingCenter.Comments = []
        }

        shopping.ShoppingCenter.Comments.push({
          Comment: commentText,
          CommentDate: new Date().toISOString(),
        })

        shopping.ShoppingCenter.Comments = this.sortCommentsByDate(shopping.ShoppingCenter.Comments)

        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

  addReply(marketSurveyId: number, commentId: number): void {
    if (!this.newReplies[commentId]?.trim()) {
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

    this.isLoading = true

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
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

        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

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
        this.open(likeTpl, shopping)
        this.clickTimeout = null
      }, 250)
    }
  }

  addLike(shopping: Center, reactionId: number): void {
    const contactIdStr = localStorage.getItem("contactId")
    if (!contactIdStr) {
      return
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : "0", 10)

    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some((reaction: Reaction) => reaction.ContactId === contactId)
    ) {
      return
    }

    if (this.isLikeInProgress) {
      return
    }

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
      next: () => {},
      error: () => {
        this.isLoading = false
        this.isLikeInProgress = false
      },
      complete: () => {
        this.isLoading = false
        this.isLikeInProgress = false
        this.cdr.markForCheck()
      },
    })
  }

  isLiked(shopping: any): boolean {
    return shopping?.ShoppingCenter?.Reactions?.length >= 1
  }

  trackByShoppingId(item: any): number {
    return item.Id
  }

  trackByCommentId(index: number, item: any): number {
    return item.Id || index
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
    this.touchStartX = 0
    this.touchEndX = 0
  }

  private setupGlobalClickListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.globalClickListenerr = this.renderer.listen("document", "click", (event: Event) => {
        if (this.isOptionSelected) {
          this.isOptionSelected = false
          return
        }

        const target = event.target as HTMLElement
        const expandedDetails = document.querySelector(".shopping-center-details.expanded")
        const seeMoreBtn = document.querySelector(".see-more-btn")

        if (expandedDetails && !expandedDetails.contains(target) && seeMoreBtn && !seeMoreBtn.contains(target)) {
          this.ngZone.run(() => {
            this.showDetails.fill(false)
            this.cdr.markForCheck()
          })
        }
      })
    })

    this.setupScrollListener()
  }

  private setupScrollListener(): void {
    this.ngZone.runOutsideAngular(() => {
      const scrollHandler = () => {
        if (!this.isOptionSelected) {
          this.ngZone.run(() => {
            this.showDetails.fill(false)
            this.cdr.markForCheck()
          })
        }
      }

      this.scrollContainer.nativeElement.addEventListener("scroll", scrollHandler, { passive: true })
    })
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkMobileView()
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768
    this.cdr.detectChanges()
  }

  openCustomPanel(shopping: any): void {
    this.currentShopping = shopping
    this.isPanelOpen = true
    this.cdr.markForCheck()

    document.body.classList.add("panel-open")

    this.renderer.listen("document", "click", (event: Event) => {
      const panelElement = this.panelContent?.nativeElement
      if (panelElement && !panelElement.contains(event.target) && this.isPanelOpen) {
        this.closeCustomPanel()
      }
    })
  }

  closeCustomPanel(): void {
    document.body.classList.remove("panel-open")

    if (this.panelContent) {
      this.renderer.setStyle(this.panelContent.nativeElement, "transform", "translateY(100%)")
      this.renderer.setStyle(this.panelContent.nativeElement, "transition", "transform 0.3s ease-out")

      this.isPanelOpen = false
      this.currentShopping = null
      this.cdr.markForCheck()
    } else {
      this.isPanelOpen = false
      this.currentShopping = null
      this.cdr.markForCheck()
    }

    this.removeGlobalTouchListeners()
  }

  handlePanelTouchStart(event: TouchEvent): void {
    this.panelStartY = event.touches[0].clientY
    this.panelCurrentY = this.panelStartY

    this.documentTouchMoveListener = this.renderer.listen("document", "touchmove", (e: TouchEvent) => {
      this.handlePanelTouchMove(e)
    })

    this.documentTouchEndListener = this.renderer.listen("document", "touchend", (e: TouchEvent) => {
      this.handlePanelTouchEnd(e)
    })
  }

  handlePanelTouchMove(event: TouchEvent): void {
    this.panelCurrentY = event.touches[0].clientY
    const deltaY = this.panelCurrentY - this.panelStartY

    if (deltaY > 0) {
      event.preventDefault()
      if (this.panelContent) {
        this.renderer.setStyle(this.panelContent.nativeElement, "transform", `translateY(${deltaY}px)`)
        this.renderer.setStyle(this.panelContent.nativeElement, "transition", "none")
      }
    }
  }

  handlePanelTouchEnd(event: TouchEvent): void {
    const deltaY = this.panelCurrentY - this.panelStartY

    if (this.panelContent) {
      this.renderer.setStyle(this.panelContent.nativeElement, "transition", "transform 0.3s ease-out")

      if (deltaY > this.PANEL_SWIPE_THRESHOLD) {
        // Swipe down - close the panel
        this.renderer.setStyle(this.panelContent.nativeElement, "transform", "translateY(100%)")
        this.closeCustomPanel()
      } else {
        // Reset position
        this.renderer.setStyle(this.panelContent.nativeElement, "transform", "translateY(0)")
      }
    }

    this.removeGlobalTouchListeners()
  }

  removeGlobalTouchListeners(): void {
    if (this.documentTouchMoveListener) {
      this.documentTouchMoveListener()
      this.documentTouchMoveListener = null
    }

    if (this.documentTouchEndListener) {
      this.documentTouchEndListener()
      this.documentTouchEndListener = null
    }
  }

  handleContentDoubleClick(event: MouseEvent, shopping: Center): void {
    const clickTime = new Date().getTime()
    const timeDiff = clickTime - this.lastClickTime
    const contactIdStr = localStorage.getItem("contactId")
    if (!contactIdStr) {
      return
    }
    const contactId = Number.parseInt(contactIdStr ? contactIdStr : "0", 10)
    if (
      shopping.ShoppingCenter.Reactions &&
      shopping.ShoppingCenter.Reactions.some((reaction: Reaction) => reaction.ContactId === contactId)
    ) {
      return
    }
    if (timeDiff < this.DOUBLE_CLICK_THRESHOLD) {
      event.preventDefault()
      event.stopPropagation()
      this.heartX = event.clientX
      this.heartY = event.clientY
      if (!contactIdStr) {
        return
      }
      this.showHeartAnimation()
      this.addLike(shopping, 1)
      this.lastClickTime = 0
    } else {
      this.lastClickTime = clickTime
    }
  }

  showHeartAnimation(): void {
    this.ngZone.run(() => {
      if (this.heartTimeout) {
        clearTimeout(this.heartTimeout)
        this.heartTimeout = null
      }
      this.heartVisible = false
      this.cdr.detectChanges()
      setTimeout(() => {
        this.heartVisible = true
        this.cdr.detectChanges()
        this.heartTimeout = setTimeout(() => {
          this.heartVisible = false
          this.cdr.detectChanges()
        }, 3000)
      }, 10)
    })
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {})
      .catch((err) => {})
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
    this.isLoading = true

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
        this.isLoading = false
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
      error: () => {
        this.isLoading = false
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
    if (this.shoppingCenterIdToDelete) {
      await this.shoppingCenterService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete)
      this.modalService.dismissAll()
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    this.shoppingCenterService.toggleShortcuts(id, close, event)
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude)
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true
    await this.shoppingCenterService.initializeMap("mappopup", lat, lng)
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
        this.viewOnStreet(this.General.modalObject)
      }, 100)
    }
  }

  viewOnStreet(modalObject: any) {
    const lat = +modalObject.StreetLatitude
    const lng = +modalObject.StreetLongitude
    const heading = modalObject.Heading || 165
    const pitch = modalObject.Pitch || 0

    setTimeout(() => {
      this.shoppingCenterService.initializeStreetView("street-view", lat, lng, heading, pitch)
    })
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url)
    this.cdr.markForCheck()
  }

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenter: any) {
    this.DeletedSC = shoppingCenter
    this.shoppingCenterIdToDelete = shoppingCenter.Id
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  openContactsModal(content: any): void {
    this.isLoading = true

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
        this.isLoading = false
        this.modalService.open(content, {
          size: "lg",
          centered: true,
        })
        this.cdr.markForCheck()
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

  openGallery(shpping: number) {
    this.GetPlaceDetails(0, shpping)
    this.modalService.open(this.galleryModal, { size: "xl", centered: true })
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    this.isLoading = true

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
        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.shoppingCenterService.restoreShoppingCenter(MarketSurveyId, Deleted)
  }

  selectRating(rating: string): void {
    this.selectedRating = rating
    this.cdr.markForCheck()
  }

  selectCenterAndContinue(selectedCenter: any, modal: any): void {
    if (!selectedCenter) return

    this.selectedCenterId = selectedCenter.Id

    if (this.selectedRating) {
      this.submitFeedback(modal, false)
    } else {
      this.updateComparisonView(selectedCenter)
    }
  }

  updateComparisonView(selectedCenter: any): void {
    this.viewedCenters.add(selectedCenter.Id)

    this.General.modalObject = selectedCenter

    this.loadNextComparisonCenter()

    this.selectedRating = null
    this.feedbackNote = ""

    this.cdr.markForCheck()
  }

  loadNextComparisonCenter(): void {
    const availableCenters = this.shoppingCenters.filter(
      (center) => !this.viewedCenters.has(center.Id) && center.Id !== this.General.modalObject.Id,
    )

    if (availableCenters.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCenters.length)
      this.General.comparisonObject = availableCenters[randomIndex]
    } else {
      this.General.comparisonObject = null
    }
  }

  skipComparison(): void {
    if (!this.General.comparisonObject) return

    this.updateComparisonView(this.General.comparisonObject)
  }

  submitFeedback(modal: any, closeModal = true): void {
    if (!this.selectedRating) {
      return
    }

    const feedback = {
      id: Date.now(), // Temporary ID until API integration
      centerId: this.selectedCenterId || this.General.modalObject.Id,
      rating: this.selectedRating,
      note: this.feedbackNote || "",
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("ContactId") || "anonymous",
    }

    this.feedbackData.push(feedback)

    this.feedbackSubmitted = true

    if (this.selectedRating === "like") {
      const shopping = this.shoppingCenters.find((s) => s.Id === feedback.centerId)
      if (shopping) {
        this.addLike(shopping, 1)
      }
    }

    if (closeModal) {
      this.resetFeedbackForm()

      modal.close()
    } else {
      const selectedCenter = this.shoppingCenters.find((s) => s.Id === feedback.centerId)
      if (selectedCenter) {
        this.updateComparisonView(selectedCenter)
      }
    }
  }

  resetFeedbackForm(): void {
    this.selectedRating = null
    this.selectedCenterId = null
    this.feedbackNote = ""
    this.feedbackSubmitted = false
    this.viewedCenters.clear()
    this.cdr.markForCheck()
  }

  open(content: any, currentShopping: any) {
    this.resetFeedbackForm()
    this.General.modalObject = currentShopping
    this.viewedCenters.add(currentShopping.Id)
    this.loadNextComparisonCenter()
    this.modalService.open(content, {
      windowClass: "custom-modal",
    })
  }

  requestCenterStatus(shoppingCenterId: number, campaignId: any) {
    // Set loading state to true to show the skeleton loader
    this.isLoadingstatus = true

    // Open the modal immediately
    this.modalRef = this.modalService.open(this.statusModal, {
      size: "lg",
      scrollable: true,
    })

    // Fetch the actual data
    this.PlacesService.GetSiteCurrentStatus(shoppingCenterId, campaignId).subscribe({
      next: (res: any) => {
        // Update the content with the fetched data
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(res)
        this.isLoadingstatus = false // Hide the skeleton loader
        this.cdr.detectChanges() // Trigger change detection
      },
      error: () => {
        // Handle errors and show fallback content
        const errHtml = "<p>Error loading content</p>"
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml)
        this.isLoadingstatus = false // Hide the skeleton loader
        this.cdr.detectChanges()
      },
    })
  }

  openModalSubmission(submissions: any[], submissionModal: TemplateRef<any>): void {
    this.submissions = submissions
    this.modalService.open(submissionModal, { size: "md", scrollable: true })
  }
  getCircleProgress(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155
    const totalLength = circumference
    const gapSize = (5 / 100) * totalLength // 5% gap size

    // If 100%, return full circle without gaps
    if (percentage === 100) {
      return `${totalLength} 0`
    }

    // Calculate the length for the green progress
    const progressLength = (percentage / 100) * (totalLength - 2 * gapSize)
    return `${progressLength} ${totalLength}`
  }

  getCircleProgressBackground(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155
    const totalLength = circumference
    const gapSize = (5 / 100) * totalLength // 5% gap

    // If 100%, don't show background
    if (percentage === 100) {
      return `0 ${totalLength}`
    }

    // Calculate the remaining percentage
    const remainingPercentage = 100 - percentage
    const bgLength = (remainingPercentage / 100) * (totalLength - 2 * gapSize)
    const startPosition = (percentage / 100) * (totalLength - 2 * gapSize) + gapSize

    return `0 ${startPosition} ${bgLength} ${totalLength}`
  }
  checkSubmission(submissions: any[] | undefined): boolean {
    if (!submissions || !Array.isArray(submissions)) {
      return false
    }

    // Loop through submissions and return true if any submission has a SubmmisionLink
    return submissions.some((submission) => submission.SubmmisionLink !== null)
  }
  get localStorage() {
    return localStorage
  }
  loadStages(): void {
    const body = {
      Name: "GetKanbanTemplateStages",
      Params: { KanbanTemplateId: 6 },
    }

    this.PlacesService.GenericAPI(body).subscribe({
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
          .sort((a: Stage, b: Stage) => a.stageOrder - b.stageOrder)

        // Update the selected stage name after loading stages
        if (this.selectedStageId === 0) {
          this.selectedStageName = "All"
        } else {
          const current = this.stages.find((s) => s.id === this.selectedStageId)
          this.selectedStageName = current ? current.stageName : "Stage"
        }
        this.cdr.detectChanges()
      },
      error: (err) => console.error("Error loading kanban stages:", err),
    })
  }

  onStageChange(id: number) {
    // Client-side filtering
    this.selectedStageId = id
    this.shoppingCenterService.setSelectedStageId(id)
  }

  selectStagekan(id: number) {
    // Use the service to update the stage ID
    this.shoppingCenterService.setSelectedStageId(id)
  }
}
