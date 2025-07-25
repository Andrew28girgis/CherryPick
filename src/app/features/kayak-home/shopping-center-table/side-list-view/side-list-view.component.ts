import {
    ChangeDetectorRef,
  Component,
  HostListener,
   NgZone,
   OnInit,
   OnDestroy,
   TemplateRef,
  ViewChild,
} from "@angular/core"
import  { ActivatedRoute } from "@angular/router"
import  { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap"
import  { BuyboxCategory } from "src/app/shared/models/buyboxCategory"
import  { Center, SentMails, Stage } from "../../../../shared/models/shoppingCenters"
import  { BbPlace } from "src/app/shared/models/buyboxPlaces"
import  { Polygon } from "src/app/shared/models/polygons"
import { General } from "src/app/shared/models/domain"
import   { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import   { PlacesService } from "src/app/core/services/places.service"
import   { MapsService } from "src/app/core/services/maps.service"
import   { ViewManagerService } from "src/app/core/services/view-manager.service"
import { Subscription } from "rxjs"
import { ContactBrokerComponent } from "../contact-broker/contact-broker.component"
import   { Email } from "src/app/shared/models/email"

declare const google: any

@Component({
  selector: "app-side-list-view",
  templateUrl: "./side-list-view.component.html",
  styleUrls: ["./side-list-view.component.css"],
})
export class SideListViewComponent implements OnInit, OnDestroy {
  General: General = new General()
  cardsSideList: Center[] = []
  map: any
  // BuyBoxId!: any
  orgId!: any
  mapViewOnePlacex = false
  buyboxCategories: BuyboxCategory[] = []
  shoppingCenters: Center[] = []
  shoppingCenter: any
  buyboxPlaces: BbPlace[] = []
  savedMapView: any
  Polygons: Polygon[] = []
  placesRepresentative: boolean | undefined
  selectedId: number | null = null
  selectedIdCard: number | null = null
  shoppingCenterIdToDelete: number | null = null
  DeletedSC: any
  sanitizedUrl!: any
  shareLink: any
  StreetViewOnePlace!: boolean
  KanbanStages: any[] = []

  // Improved dropdown management
  activeDropdownId: number | null = null
  isUpdatingStage = false

  @ViewChild("statusModal", { static: true }) statusModal!: TemplateRef<any>
  htmlContent!: SafeHtml
  private modalRef?: NgbModalRef
  isLoadingstatus = true
  isLoading = true
  skeletonItems = Array(6)
  selectedStageName = "All"
  stages: Stage[] = []
  selectedStageId = 0
  allShoppingCenters: Center[] = []
  CampaignId!: any
  @ViewChild("mailModal", { static: true }) mailModalTpl!: TemplateRef<any>

  selectedMailSubject = ""
  selectedMailDate = new Date()
  selectedMailBody: SafeHtml = ""
  openedEmail!: Email

  private subscriptions: Subscription[] = []
  private subscripe = new Subscription()

  submissions: any
  @ViewChild("submission", { static: true }) submissionModal!: TemplateRef<any>
  Campaign: any

  imageLoadingStates: { [key: number]: boolean } = {}
  imageErrorStates: { [key: number]: boolean } = {}

  constructor(
    private markerService: MapsService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private viewManagerService: ViewManagerService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true
    this.loadStages()

    this.subscriptions.push(
      this.viewManagerService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id
        if (id === 0) {
          this.selectedStageName = "All"
        } else {
          const stage = this.stages.find((s) => s.id === id)
          this.selectedStageName = stage ? stage.stageName : ""
        }
        this.cdr.detectChanges()
      }),
    )

    this.General = new General()
    this.savedMapView = localStorage.getItem("mapView")

    this.activatedRoute.params.subscribe((params: any) => {
      // this.BuyBoxId = params.buyboxid
      this.orgId = params.orgid
      this.Campaign = params.campaign

      // localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.orgId)
    })

    this.subscripe.add(
      this.viewManagerService.allShoppingCenters$.subscribe((centers) => {
        this.allShoppingCenters = centers
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers
        if (centers && centers.length > 0) {
          this.getAllMarker()
        }
      }),
    )

    this.isLoading = true
    this.skeletonItems = Array(6)

    this.subscriptions.push(
      this.viewManagerService.filteredCenters$.subscribe((centers) => {
        this.ngZone.run(() => {
          this.cardsSideList = centers
        })

        this.cardsSideList.forEach((center: any) => {
          center.lastOutgoingEmail = null
          center.lastIncomingEmail = null
          // Initialize dropdown state if not exists
          if (center.isDropdownOpen === undefined) {
            center.isDropdownOpen = false
          }

          if (center.SentMails && Array.isArray(center.SentMails)) {
            const outgoing = center.SentMails.filter((mail: any) => mail.Direction == 2).sort(
              (a: any, b: any) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
            )

            const incoming = center.SentMails.filter((mail: any) => mail.Direction == 1).sort(
              (a: any, b: any) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
            )

            center.lastOutgoingEmail = outgoing.length > 0 ? outgoing[0] : null
            center.lastIncomingEmail = incoming.length > 0 ? incoming[0] : null
          }
        })

        if (centers && centers.length > 0) {
          this.isLoading = false
        }
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.buyboxCategories$.subscribe((categories) => {
        this.buyboxCategories = categories
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.buyboxPlaces$.subscribe((places) => {
        this.buyboxPlaces = places
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.kanbanStages$.subscribe((stages) => {
        this.KanbanStages = stages
        this.cdr.detectChanges()
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.selectedId$.subscribe((id) => {
        this.selectedId = id
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.selectedIdCard$.subscribe((id) => {
        this.selectedIdCard = id
      }),
    )

    this.subscriptions.push(
      this.viewManagerService.dataLoadedEvent$.subscribe(() => {
        // Data is loaded, perform any additional initialization
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  // Fixed dropdown toggle method
  toggleDropdown(place: any, event?: MouseEvent): void {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Don't allow toggle if currently updating stage
    if (this.isUpdatingStage) {
      return
    }

    // Close all other dropdowns first
    this.cardsSideList.forEach((p) => {
      if (p.Id !== place.Id) {
        p.isDropdownOpen = false
      }
    })

    // Toggle the current dropdown
    place.isDropdownOpen = !place.isDropdownOpen
    this.activeDropdownId = place.isDropdownOpen ? place.Id : null

    // Force change detection
    this.cdr.detectChanges()
  }

  // Fixed select stage method
  selectStage(marketSurveyId: number, stageId: number, shoppingCenter: any, event?: MouseEvent): void {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Set updating flag to prevent dropdown toggle during update
    this.isUpdatingStage = true

    // Update the shopping center's stage immediately for UI feedback
    shoppingCenter.kanbanStageId = stageId

    // Close the dropdown
    shoppingCenter.isDropdownOpen = false
    this.activeDropdownId = null

    // Update the stage through the service
    this.viewManagerService.updatePlaceKanbanStage(marketSurveyId, stageId, shoppingCenter, this.CampaignId)

    // Force change detection
    this.cdr.detectChanges()

    // Reset updating flag after a short delay
    setTimeout(() => {
      this.isUpdatingStage = false
    }, 100)
  }

  // Improved document click handler
  @HostListener("document:click", ["$event"])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null

    // Only handle clicks if not currently updating stage
    if (this.isUpdatingStage) {
      return
    }

    // Check if click is outside any stage dropdown
    if (this.activeDropdownId && target) {
      const clickedDropdown = target.closest(".custom-dropdown")

      // If clicked outside all dropdowns, close them
      if (!clickedDropdown) {
        this.cardsSideList.forEach((place) => {
          place.isDropdownOpen = false
        })
        this.activeDropdownId = null
        this.cdr.detectChanges()
      }
    }
  }

  // Rest of your existing methods remain the same...
  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place)
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place)
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true
    this.map = await this.viewManagerService.initializeMap("mappopup", lat, lng)
  }

  async getAllMarker() {
    try {
      const { Map } = await google.maps.importLibrary("maps")
      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView)
        this.map = new Map(document.getElementById("map") as HTMLElement, {
          center: {
            lat: lat,
            lng: lng,
          },
          zoom: zoom,
          mapId: "1234567890",
        })
        this.map.addListener("dragend", () => this.onMapDragEnd(this.map))
        this.map.addListener("zoom_changed", () => this.onMapDragEnd(this.map))
        this.map.addListener("bounds_changed", () => this.onMapDragEnd(this.map))
      } else {
        this.map = new Map(document.getElementById("map") as HTMLElement, {
          center: {
            lat: this.shoppingCenters[0].Latitude,
            lng: this.shoppingCenters[0].Longitude,
          },
          zoom: 8,
          mapId: "1234567890",
        })
        this.map.addListener("dragend", () => this.onMapDragEnd(this.map))
        this.map.addListener("zoom_changed", () => this.onMapDragEnd(this.map))
        this.map.addListener("bounds_changed", () => this.onMapDragEnd(this.map))
      }

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, "Shopping Center")
      }

      this.GetPolygons()
      this.createCustomMarkers(this.buyboxCategories)
    } finally {
      // Any cleanup code
    }
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData)
    })
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map)
    this.updateShoppingCenterCoordinates()
    this.updateCardsSideList(map)
  }

  private saveMapView(map: any): void {
    const center = map.getCenter()
    const zoom = map.getZoom()
    localStorage.setItem(
      "mapView",
      JSON.stringify({
        lat: center.lat(),
        lng: center.lng(),
        zoom: zoom,
      }),
    )
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude
        center.Longitude = center.Longitude
      })
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type)
    })
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds()
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds)
    const visibleCoords = new Set(visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`))
    const allProperties = [...(this.shoppingCenters || [])]
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) || this.isWithinBounds(property, bounds),
      )
    })
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = Number.parseFloat(property.Latitude)
    const lng = Number.parseFloat(property.Longitude)
    if (isNaN(lat) || isNaN(lng)) {
      return false
    }
    return bounds?.contains({ lat, lng })
  }

  GetPolygons(): void {
    const body: any = {
      Name: "PolygonStats",
      Params: {
        CampaignId: this.CampaignId,
      },
    }
    this.placesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json
        this.markerService.drawMultiplePolygons(this.map, this.Polygons)
      },
    })
  }

  getPolygons() {
    const body: any = {
      Name: "GetBuyBoxSCsIntersectPolys",
      Params: {
        CampaignId: this.CampaignId,
        PolygonSourceId: 0,
      },
    }
    this.placesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json
      this.markerService.drawMultiplePolygons(this.map, this.Polygons)
    })
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.viewManagerService.getShoppingCenterUnitSize(shoppingCenter)
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.viewManagerService.getNearestCategoryName(categoryId)
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.viewManagerService.isLast(currentItem, array)
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude)
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

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManagerService.sanitizeUrl(url)
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
        this.viewManagerService.initializeStreetView("street-view", lat, lng, heading, pitch)
      }
    })
  }

  copyLink(link: string) {
    navigator.clipboard.writeText(link)
  }

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenter: any) {
    this.DeletedSC = shoppingCenter
    this.shoppingCenterIdToDelete = shoppingCenter.Id
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  async deleteShCenter() {
    try {
      // await this.viewManagerService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete!)
      this.modalService.dismissAll()
    } catch (error) {
      console.error("Error deleting shopping center:", error)
    }
  }

  async RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean, placeId: number) {
    try {
      await this.viewManagerService.restoreShoppingCenter(+MarketSurveyId, Deleted)
      this.toggleShortcuts(placeId, "close")
    } catch (error) {
      console.error("Error restoring shopping center:", error)
    }
  }

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement
    const isInside = targetElement.closest(".shortcuts_iconCard, .ellipsis_icont")

    if (!isInside) {
      this.viewManagerService.setSelectedIdCard(null)
      document.removeEventListener("click", this.outsideClickHandler)
    }
  }

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation()

    if (this.selectedIdCard === id) {
      this.viewManagerService.setSelectedIdCard(null)
      document.removeEventListener("click", this.outsideClickHandler)
    } else {
      this.viewManagerService.setSelectedIdCard(id)
      setTimeout(() => {
        document.addEventListener("click", this.outsideClickHandler)
      })
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    this.viewManagerService.toggleShortcuts(id, close, event)
  }

  getSelectedStageName(stageId: number): string {
    return this.viewManagerService.getSelectedStageName(stageId)
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: "xl",
      centered: true,
      windowClass: "contact-broker-modal-class",
    })
    modalRef.componentInstance.center = center
    // modalRef.componentInstance.buyboxId = this.BuyBoxId
  }

  trackById(index: number, place: any): number {
    return place.Id
  }

  requestCenterStatus(shoppingCenterId: number, campaignId: any) {
    this.isLoadingstatus = true

    this.modalRef = this.modalService.open(this.statusModal, {
      size: "lg",
      scrollable: true,
    })

    this.placesService.GetSiteCurrentStatus(shoppingCenterId, campaignId).subscribe({
      next: (res: any) => {
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(res)
        this.isLoadingstatus = false
        this.cdr.detectChanges()
      },
      error: () => {
        const errHtml = "<p>Error loading content</p>"
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml)
        this.isLoadingstatus = false
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
    const gapSize = (5 / 100) * totalLength

    if (percentage === 100) {
      return `${totalLength} 0`
    }

    const progressLength = (percentage / 100) * (totalLength - 2 * gapSize)
    return `${progressLength} ${totalLength}`
  }

  getCircleProgressBackground(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155
    const totalLength = circumference
    const gapSize = (5 / 100) * totalLength

    if (percentage === 100) {
      return `0 ${totalLength}`
    }

    const remainingPercentage = 100 - percentage
    const bgLength = (remainingPercentage / 100) * (totalLength - 2 * gapSize)
    const startPosition = (percentage / 100) * (totalLength - 2 * gapSize) + gapSize

    return `0 ${startPosition} ${bgLength} ${totalLength}`
  }

  checkSubmission(submissions: any[] | undefined): boolean {
    if (!submissions || !Array.isArray(submissions)) {
      return false
    }

    return submissions.some((submission) => submission.SubmmisionLink !== null)
  }

  loadStages(): void {
    const body = {
      Name: "GetKanbanTemplateStages",
      Params: { KanbanTemplateId: 6 },
    }

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
          .sort((a: Stage, b: Stage) => a.stageOrder - b.stageOrder)

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
    this.selectedStageId = id
    this.viewManagerService.setSelectedStageId(id)
  }

  selectStagekan(id: number) {
    this.viewManagerService.setSelectedStageId(id)
  }

  getSentMails(shopping: any): SentMails[] {
    const raw: any[] = shopping?.SentMails ?? []
    return raw.map((mail) => ({
      Id: mail.ID,
      Date: new Date(mail.Date),
      Direction: mail.Direction,
    }))
  }

  openMailPopup(mailId: number): void {
    const payload = {
      Name: "GetMail",
      Params: { mailid: mailId },
    }

    this.placesService.GenericAPIHtml(payload).subscribe({
      next: (res: any) => {
        this.openedEmail = res.json[0]

        this.openedEmail.Body = this.sanitizer.bypassSecurityTrustHtml(this.openedEmail.Body)

        this.modalService.open(this.mailModalTpl, {
          size: "lg",
        })
      },
    })
  }

  onCheckboxChange(event: Event, placeId: number, campaignId: number): void {
    const checkbox = event.target as HTMLInputElement

    if (checkbox.checked) {
      this.AddPlaceToMarketSurvery(campaignId, placeId)
    } else {
      console.log(`Unchecked place with ID ${placeId} from shopping center ${campaignId}`)
      this.AddPlaceToMarketSurvery(campaignId, placeId)
    }
  }

  AddPlaceToMarketSurvery(campaignId: number, placeId: number): void {
    const body: any = {
      Name: "AddPlaceToMarketSurvery",
      MainEntity: null,
      Params: {
        CampaignID: campaignId,
        PlaceID: placeId,
      },
      Json: null,
    }
    this.placesService.GenericAPI(body).subscribe({
      next: (data) => {
        console.log("API response data:", data)
      },
    })
  }

  onImageLoad(shoppingId: number): void {
    this.imageLoadingStates[shoppingId] = false
    this.imageErrorStates[shoppingId] = false
    this.cdr.detectChanges()
  }

  onImageError(shopping: any): void {
    this.imageLoadingStates[shopping.Id] = false
    this.imageErrorStates[shopping.Id] = true

    if (shopping.MainImage && !shopping.MainImage.includes("DefaultImage.png")) {
      shopping.MainImage = "assets/Images/DefaultImage.png"
    }
    this.cdr.detectChanges()
  }

  getImageUrl(shopping: any): string {
    return shopping.MainImage || "assets/Images/DefaultImage.png"
  }
}
