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
} from "@angular/core"
import   { ActivatedRoute } from "@angular/router"
import   { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap"
import   { BuyboxCategory } from "src/app/shared/models/buyboxCategory"
import   { Center, Stage } from "../../../../shared/models/shoppingCenters"
import { General } from "src/app/shared/models/domain"
import { Subscription } from "rxjs"
import   { ViewManagerService } from "src/app/core/services/view-manager.service"
import { ContactBrokerComponent } from "../contact-broker/contact-broker.component"
import   { PlacesService } from "src/app/core/services/places.service"
import   { DomSanitizer, SafeHtml } from "@angular/platform-browser"

@Component({
  selector: "app-table-view",
  templateUrl: "./table-view.component.html",
  styleUrls: ["./table-view.component.css"],
})
export class TableViewComponent implements OnInit, OnDestroy {
  // Properties
  General: General = new General()
  BuyBoxId!: any
  campaignid!: any
  OrgId!: any
  buyboxCategories: BuyboxCategory[] = []
  showShoppingCenters = true
  shoppingCenters: Center[] = []
  filteredCenters: Center[] = []

  searchQuery = ""
  selectedId: number | null = null
  placesRepresentative: boolean | undefined
  StreetViewOnePlace!: boolean
  sanitizedUrl!: any
  mapViewOnePlacex = false
  selectedIdCard: number | null = null
  @Output() viewChange = new EventEmitter<number>()
  shoppingCenterIdToDelete: number | null = null
  DeletedSC: any
  selectedStageName = "All"
  stages: Stage[] = []
  selectedStageId = 0 // Default to 0 (All)
  allShoppingCenters: Center[] = [] // Store all shopping centers

  // Loading state for skeleton
  isLoading = true
  isLoadingstatus = true
  // Kanban stages
  KanbanStages: any[] = []
  activeDropdown: any = null

  @ViewChild("statusModal", { static: true }) statusModal!: TemplateRef<any>
  htmlContent!: SafeHtml
  private modalRef?: NgbModalRef

  private subscriptions = new Subscription()
  private outsideClickHandler: ((e: Event) => void) | null = null
  submissions: any
  @ViewChild("submission", { static: true }) submissionModal!: TemplateRef<any>
  Campaign: any
  CampaignId!: any

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.General = new General()
    this.loadStages()

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
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.Campaign = params.campaign
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
      this.shoppingCenterService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers
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

    this.subscriptions.add(
      this.shoppingCenterService.kanbanStages$.subscribe((stages) => {
        this.KanbanStages = stages
        this.cdr.detectChanges()
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()

    // Remove any document event listeners
    if (this.outsideClickHandler) {
      document.removeEventListener("click", this.outsideClickHandler)
      this.outsideClickHandler = null
    }
    
   }

  filterCenters() {
    this.shoppingCenterService.filterCenters(this.searchQuery)
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.shoppingCenterService.restoreShoppingCenter(MarketSurveyId, Deleted)
  }

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenter: any) {
    this.DeletedSC = shoppingCenter
    this.shoppingCenterIdToDelete = shoppingCenter.Id
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  async deleteShCenter() {
    if (this.shoppingCenterIdToDelete) {
      await this.shoppingCenterService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete)
      this.modalService.dismissAll()
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.shoppingCenterService.getNearestCategoryName(categoryId)
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.shoppingCenterService.getShoppingCenterUnitSize(shoppingCenter)
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    this.shoppingCenterService.toggleShortcuts(id, close, event)
  }

  outsideClickHandlerr = (event: Event): void => {
    const targetElement = event.target as HTMLElement
    const isInside = targetElement.closest(".shortcuts_iconCard, .ellipsis_icont")

    if (!isInside) {
      this.shoppingCenterService.setSelectedIdCard(null)
      document.removeEventListener("click", this.outsideClickHandlerr)
    }
  }

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation()
    if (this.selectedIdCard === id) {
      this.shoppingCenterService.setSelectedIdCard(null)
      document.removeEventListener("click", this.outsideClickHandlerr)
    } else {
      this.shoppingCenterService.setSelectedIdCard(id)
      setTimeout(() => {
        document.addEventListener("click", this.outsideClickHandlerr)
      })
    }
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.shoppingCenterService.isLast(currentItem, array)
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

  openStatus(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    this.General.modalObject = modalObject
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
    this.sanitizedUrl = this.shoppingCenterService.sanitizeUrl(url)
  }

  // Toggle dropdown for kanban stages
  toggleDropdown(shoppingCenter: any): void {
    this.activeDropdown = this.shoppingCenterService.toggleDropdown(shoppingCenter, this.activeDropdown)
  }

  // Get stage name for the selected ID
  getSelectedStageName(stageId: number): string {
    return this.shoppingCenterService.getSelectedStageName(stageId)
  }

  // Select a stage for a shopping center
  selectStage(marketSurveyId: number, stageId: number, shoppingCenter: any): void {
    shoppingCenter.isDropdownOpen = false
    this.activeDropdown = null
    this.shoppingCenterService.updatePlaceKanbanStage(marketSurveyId, stageId, shoppingCenter,this.CampaignId)
  }

  // Handle document clicks to close dropdowns
  @HostListener("document:click", ["$event"])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null
    if (this.activeDropdown && target && !target.closest(".custom-dropdown")) {
      this.activeDropdown.isDropdownOpen = false
      this.activeDropdown = null
      this.cdr.detectChanges()
    }
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: "xl",
      centered: true,
      windowClass: "contact-broker-modal-class",
    })
    modalRef.componentInstance.center = center
    modalRef.componentInstance.buyboxId = this.BuyBoxId
  }

  trackByIndex(index: number, item: any): number {
    return index
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
    this.placesService.GetSiteCurrentStatus(shoppingCenterId, campaignId).subscribe({
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
  loadStages(): void {
    const body = {
      Name: "GetKanbanTemplateStages",
      Params: { KanbanTemplateId: 6 },
    }

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

    // Update the selected stage name for display
    if (id === 0) {
      this.selectedStageName = "All"
    } else {
      const stage = this.stages.find((s) => s.id === id)
      this.selectedStageName = stage ? stage.stageName : "Stage"
    }
  }

  selectStagekan(id: number) {
    this.shoppingCenterService.setSelectedStageId(id)
  }
     onCheckboxChange(event: Event, placeId: number, campaignId: number): void {
  const checkbox = event.target as HTMLInputElement;
  
  if (checkbox.checked) {
    this.AddPlaceToMarketSurvery(campaignId, placeId);
  } else {
    console.log(`Unchecked place with ID ${placeId} from shopping center ${campaignId}`);
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
    next: (data) => {
      console.log("API response data:", data);
    }
  });
}
}
