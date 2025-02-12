import  { SocialMedialService } from "./../../../services/socialMedia.service"
import {
  Component,
   OnInit,
   NgZone,
  ViewChild,
   ElementRef,
   TemplateRef,
  Output,
  EventEmitter,
  HostListener,
  Renderer2,
} from "@angular/core"
import { NgForm } from '@angular/forms'; // <-- Import NgForm
import  { ActivatedRoute, Router } from "@angular/router"
import  { PlacesService } from "./../../../../../src/app/services/places.service"
import {  AllPlaces, type AnotherPlaces, General, type Property } from "./../../../../../src/models/domain"
declare const google: any
import  { NgxSpinnerService } from "ngx-spinner"
import  { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap"
import  { MapsService } from "src/app/services/maps.service"
import  { BuyboxCategory } from "src/models/buyboxCategory"
import  { Center, Place } from "src/models/shoppingCenters"
import  { BbPlace } from "src/models/buyboxPlaces"
import  { DomSanitizer } from "@angular/platform-browser"
import  { Polygons } from "src/models/polygons"
import  { ShareOrg } from "src/models/shareOrg"
import  { StateService } from "src/app/services/state.service"
import  { permission } from "src/models/permission"
import  { BuyBoxCityState, ShoppingCenter } from "src/models/buyboxShoppingCenter"

interface Comment {
  id: number
  text: string
  user: string
  parentId: number | null
  replies: Comment[]
  MarketSurveyId: number
}

@Component({
  selector: "app-shopping-center-table",
  templateUrl: "./shopping-center-table.component.html",
  styleUrls: ["./shopping-center-table.component.css"],
})
export class ShoppingCenterTableComponent implements OnInit {
  @ViewChild("mainContainer") mainContainer!: ElementRef
  shoppingCenter: any
  selectedView = "shoppingCenters"
  General!: General
  pageTitle!: string
  BuyBoxId!: any
  OrgId!: any
  page = 1
  pageSize = 25
  paginatedProperties: Property[] = []
  filteredProperties: Property[] = []
  dropdowmOptions: any = [
    {
      text: "Map View",
      icon: "../../../assets/Images/Icons/map.png",
      status: 1,
    },
    {
      text: "Side List View",
      icon: "../../../assets/Images/Icons/element-3.png",
      status: 2,
    },
    {
      text: "Cards View",
      icon: "../../../assets/Images/Icons/grid-1.png",
      status: 3,
    },
    {
      text: "Table View",
      icon: "../../../assets/Images/Icons/grid-4.png",
      status: 4,
    },
    {
      text: "Social View",
      icon: "../../../assets/Images/Icons/globe-solid.svg",
      status: 5,
    },
  ]
  isOpen = false
  allPlaces!: AllPlaces
  anotherPlaces!: AnotherPlaces
  currentView: any
  centerPoints: any[] = []
  map: any // Add this property to your class
  isCompetitorChecked = false // Track the checkbox state
  isCoTenantChecked = false
  cardsSideList: any[] = []
  selectedOption!: number
  selectedSS!: any
  savedMapView: any
  mapViewOnePlacex = false
  buyboxCategories: BuyboxCategory[] = []
  showShoppingCenters = true // Ensure this reflects your initial state
  shoppingCenters: Center[] = []
  MarketSurveyId: Center[] = []
  BuyBoxCitiesStates!: BuyBoxCityState[]
  StateCodes: string[] = []
  filteredCities: string[] = []
  // Selected filters
  selectedState = "0"
  selectedCity = ""
  filteredBuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = []
  BuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = []
  @ViewChild("deleteShoppingCenterModal")
  deleteShoppingCenterModal!: TemplateRef<any>
  shoppingCenterIdToDelete: number | null = null


  lastTap = 0
  showToast = false
  toastMessage = ""
  reactions: { [key: number]: string } = {}
  showReactions: { [key: number]: boolean } = {}
  replyingTo: { [key: number]: number | null } = {}
  reactionTimers: { [key: number]: any } = {}
  newComments: { [key: number]: string } = {}
  newReplies: { [key: number]: string } = {}
  Comments: { [key: number]: string } = {}
  comments: { [key: number]: Comment[] } = {}
  likes: { [key: string]: number } = {}
  showComments: { [key: number]: boolean } = {}
  OrganizationContacts: any[] = [];
  newContact: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  
  toggleShoppingCenters() {
    this.showShoppingCenters = !this.showShoppingCenters
  }

  showStandalone = true // Ensure this reflects your initial state
  standAlone: Place[] = []

  toggleStandalone() {
    this.showStandalone = !this.showStandalone
  }

  showbackIds: number[] = []
  showbackIdsJoin: any

  deleteShopping(placeId: number) {
    const index = this.showbackIds.indexOf(placeId)
    if (index === -1) {
      this.showbackIds.push(placeId)
    } else {
      this.showbackIds.splice(index, 1)
    }
    this.selectedIdCard = null
  }

  ArrOfDelete(modalTemplate: TemplateRef<any>) {
    this.showbackIdsJoin = this.showbackIds.join(",")
    this.openDeleteShoppingCenterModal(modalTemplate, this.showbackIdsJoin)
  }

  CancelDelete() {
    this.showbackIds = []
  }

  CancelOneDelete(id: number) {
    const index = this.showbackIds.indexOf(id)
    if (index !== -1) {
      this.showbackIds.splice(index, 1)
    }
  }

  buyboxPlaces: BbPlace[] = []
  Polygons: Polygons[] = []
  ShareOrg: ShareOrg[] = []
  shareLink: any
  BuyBoxName = ""
  Permission: permission[] = []
  placesRepresentative: boolean | undefined
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    private stateService: StateService,
    private socialService: SocialMedialService,
    private renderer: Renderer2,
    private el: ElementRef,

  ) {
    this.currentView = localStorage.getItem("currentView") || "4"
    this.savedMapView = localStorage.getItem("mapView")
    this.markerService.clearMarkers()
  }

  ngOnInit(): void {
    this.General = new General()
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.BuyBoxName = params.buyboxName
      localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.OrgId)

      this.BuyBoxPlacesCategories(this.BuyBoxId)
      this.GetOrganizationById(this.OrgId)
      this.GetCustomSections(this.BuyBoxId)
      this.getShoppingCenters(this.BuyBoxId)
      this.getBuyBoxPlaces(this.BuyBoxId)
    })

    this.currentView = localStorage.getItem("currentView") || "4"

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView),
    )

    if (selectedOption) {
      this.selectedOption = selectedOption.status
    }
    this.selectedState = ""
    this.selectedCity = ""
    this.applyFilters()
  }

  selectedId: number | null = null
  selectedIdCard: number | null = null
  toggleShortcutsCard(id: number, close?: string): void {
    if (close === "close") {
      this.selectedIdCard = null
    } else {
      this.selectedIdCard = this.selectedIdCard === id ? null : id
    }
  }
  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === "close") {
      this.selectedId = null
      this.selectedIdCard = null
      return
    }

    // حساب الإحداثيات إذا كان العنصر محددًا
    const targetElement = event?.target as HTMLElement;
    const rect = targetElement.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(".shortcuts_icon") as HTMLElement

    if (shortcutsIcon) {
      shortcutsIcon.style.top = `${rect.top + window.scrollY + targetElement.offsetHeight}px`; // تظهر أسفل الزر مباشرة
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`; // محاذاة مع الزر
    }

    this.selectedId = this.selectedId === id ? null : id
  }

  @Output() tabChange = new EventEmitter<{ tabId: string; shoppingCenterId: number }>()

  redirect(organizationId: any) {
    this.tabChange.emit({ tabId: "Emily", shoppingCenterId: organizationId })
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement
    const isInsideMenu = clickedElement.closest(".shortcuts_icon")
    const isEllipsisButton = clickedElement.closest(".ellipsis_icon")

    const isInsideMenuCrad = clickedElement.closest(".shortcuts_iconCard")
    const isEllipsisButtonCrad = clickedElement.closest(".ellipsis_icont")

    if (!isInsideMenuCrad && !isEllipsisButtonCrad) {
      this.selectedIdCard = null
    }

    if (!isInsideMenu && !isEllipsisButton) {
      this.selectedId = null
    }
  }

  @Output() bindClicked: EventEmitter<void> = new EventEmitter<void>()
  triggerBindAction() {
    this.bindClicked.emit()
  }
  // Extract unique states with normalization
  getStates(list: BuyBoxCityState[]) {
    this.StateCodes = Array.from(
      new Set(
        list
          .map((item) => item.state.trim().toUpperCase()) // Normalize states
          .filter((code) => !!code), // Remove empty strings
      ),
    ).sort()

    // console.log('StateCodes:', this.StateCodes);
  }
  // Handle State selection
  // Handle State selection
  onStateChange(event: any) {
    const value = event.target.value
    console.log(value)

    if (value === "") {
      this.selectedState = ""
      this.selectedCity = ""
      this.filteredCities = []
      this.filteredBuyBoxPlacesAndShoppingCenter = [...this.BuyBoxPlacesAndShoppingCenter]
    } else {
      this.filteredCities = Array.from(
        new Set(
          this.BuyBoxCitiesStates.filter((item) => item.state.trim().toUpperCase() === value.trim().toUpperCase()).map(
            (item) => item.city,
          ),
        ),
      ).sort()
    }

    this.selectedCity = ""
    this.applyFilters()
  }

  // Handle City selection
  onCityChange() {
    this.applyFilters()
  }
  // Apply Filters with Case-Insensitive Matching

  applyFilters() {
    if (!this.selectedState && !this.selectedCity) {
      this.filteredBuyBoxPlacesAndShoppingCenter = [...this.BuyBoxPlacesAndShoppingCenter]
      return
    }

    this.filteredBuyBoxPlacesAndShoppingCenter = this.BuyBoxPlacesAndShoppingCenter.filter((center) => {
      const centerState = center.CenterState.trim().toUpperCase()
      const selectedState = this.selectedState?.trim().toUpperCase() || ""
      const centerCity = center.CenterCity.trim().toLowerCase()
      const selectedCity = this.selectedCity?.trim().toLowerCase() || ""

      const matchesState = this.selectedState ? centerState === selectedState : true
      const matchesCity = this.selectedCity ? centerCity === selectedCity : true

      return matchesState && matchesCity
    })
  }

  GetCustomSections(buyboxId: number): void {
    if (this.stateService.getPermission().length > 0) {
      this.Permission = this.stateService.getPermission()
      return
    }

    const body: any = {
      Name: "GetCustomSections",
      Params: {
        BuyBoxId: buyboxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Permission = data.json
        this.placesRepresentative = this.Permission?.find(
          (item: permission) => item.sectionName === "PlacesRepresentative",
        )?.visible
        this.stateService.setPermission(data.json)

        if (this.stateService.getPlacesRepresentative()) {
          this.placesRepresentative = this.stateService.getPlacesRepresentative()
          return
        }

        this.stateService.setPlacesRepresentative(this.placesRepresentative)
        this.markerService.setPlacesRepresentative(this.placesRepresentative)
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  GetOrganizationById(orgId: number): void {
    const shareOrg = this.stateService.getShareOrg() || []

    if (shareOrg && shareOrg.length > 0) {
      this.ShareOrg = this.stateService.getShareOrg()
      return
    }

    const body: any = {
      Name: "GetOrganizationById",
      Params: {
        organizationid: orgId,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ShareOrg = data.json
        this.stateService.setShareOrg(data.json)
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories()
      this.getShoppingCenters(buyboxId)
      return
    }

    const body: any = {
      Name: "GetRetailRelationCategories",
      Params: {
        BuyBoxId: buyboxId,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json
        this.stateService.setBuyboxCategories(data.json)
        this.getShoppingCenters(this.BuyBoxId)
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  GetPolygons(buyboxId: number): void {
    const body: any = {
      Name: "GetPolygons",
      Params: {
        buyboxid: buyboxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters()
      //this.getStandAlonePlaces(buyboxId);
      return
    }

    this.spinner.show()
    const body: any = {
      Name: "GetMarketSurveyShoppingCenters",
      Params: {
        BuyBoxId: buyboxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        this.spinner.hide();
        //this.getStandAlonePlaces(this.BuyBoxId);
        this.getBuyBoxPlaces(this.BuyBoxId)
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  getStandAlonePlaces(buyboxId: number): void {
    if (this.stateService.getStandAlone()?.length > 0) {
      this.standAlone = this.stateService.getStandAlone()
      // Set selectedSS from stored value or default
      this.selectedSS = this.stateService.getSelectedSS() || (this.shoppingCenters?.length > 0 ? 1 : 2)
      this.getBuyBoxPlaces(buyboxId)
      return
    }

    this.spinner.show()
    const body: any = {
      Name: "GetMarketSurveyStandalonePlaces",
      Params: {
        BuyBoxId: buyboxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.standAlone = data.json
        this.stateService.setStandAlone(data.json)
        // Set initial selectedSS value if not already set
        if (!this.stateService.getSelectedSS()) {
          const newValue = this.shoppingCenters?.length > 0 ? 1 : 2
          this.selectedSS = newValue
          this.stateService.setSelectedSS(newValue)
        } else {
          this.selectedSS = this.stateService.getSelectedSS()
        }
        this.spinner.hide()
        this.getBuyBoxPlaces(this.BuyBoxId)
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces()
      this.getAllMarker()
      return
    }

    const body: any = {
      Name: "BuyBoxRelatedRetails",
      Params: {
        BuyBoxId: buyboxId,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json
        this.stateService.setBuyboxPlaces(data.json)
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id),
          )
        })
        this.getAllMarker()
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  getLogo(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find((branch) => branch.Id === id)
      if (foundBranch) {
        return place.id
      }
    }
    return undefined
  }

  getLogoTitle(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find((branch) => branch.Id === id)
      if (foundBranch) {
        return place.Name
      }
    }
    return undefined
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen
  }

  // async getAllMarker() {
  //   try {
  //     this.spinner.show();
  //     const { Map } = await google.maps.importLibrary('maps');

  //     if (this.savedMapView) {
  //       const { lat, lng, zoom } = JSON.parse(this.savedMapView);
  //       this.map = new Map(document.getElementById('map') as HTMLElement, {
  //         center: {
  //           lat: lat,
  //           lng: lng,
  //         },
  //         zoom: zoom,
  //         mapId: '1234567890',
  //       });
  //       this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
  //       this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
  //       this.map.addListener('bounds_changed', () =>
  //         this.onMapDragEnd(this.map)
  //       );
  //     } else {
  //       this.map = new Map(document.getElementById('map') as HTMLElement, {
  //         center: {
  //           lat: this.shoppingCenters
  //             ? this.shoppingCenters[0].Latitude
  //             : this.standAlone[0].Latitude || 0,
  //           lng: this.shoppingCenters
  //             ? this.shoppingCenters[0].Longitude
  //             : this.standAlone[0].Longitude || 0,
  //         },
  //         zoom: 8,
  //         mapId: '1234567890',
  //       });
  //       this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
  //       this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
  //       this.map.addListener('bounds_changed', () =>
  //         this.onMapDragEnd(this.map)
  //       );
  //     }

  //     if (this.shoppingCenters && this.shoppingCenters.length > 0) {
  //       this.createMarkers(this.shoppingCenters, 'Shopping Center');
  //     }

  //     if (this.standAlone && this.standAlone.length > 0) {
  //       this.createMarkers(this.standAlone, 'Stand Alone');
  //     }

  //     //this.getPolygons();
  //     this.createCustomMarkers(this.buyboxCategories);
  //   } finally {
  //     this.spinner.hide();
  //   }
  // }
  async getAllMarker() {
    try {
      this.spinner.show()
      const { Map } = await google.maps.importLibrary("maps")

      const mapElement = document.getElementById("map") as HTMLElement
      if (!mapElement) {
        console.error('Element with id "map" not found.')
        return
      }

      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView)
        this.map = new Map(mapElement, {
          center: { lat: lat, lng: lng },
          zoom: zoom,
          mapId: "1234567890",
        })
      } else {
        this.map = new Map(mapElement, {
          center: {
            lat: this.shoppingCenters ? this.shoppingCenters?.[0]?.Latitude : this.standAlone?.[0]?.Latitude || 0,
            lng: this.shoppingCenters ? this.shoppingCenters?.[0]?.Longitude : this.standAlone?.[0]?.Longitude || 0,
          },
          zoom: 8,
          mapId: "1234567890",
        })
      }

      this.map.addListener("dragend", () => this.onMapDragEnd(this.map))
      this.map.addListener("zoom_changed", () => this.onMapDragEnd(this.map))
      this.map.addListener("bounds_changed", () => this.onMapDragEnd(this.map))

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, "Shopping Center")
      }

      if (this.standAlone && this.standAlone.length > 0) {
        this.createMarkers(this.standAlone, "Stand Alone")
      }

      this.createCustomMarkers(this.buyboxCategories)
    } catch (error) {
      console.error("Error loading markers:", error)
    } finally {
      this.spinner.hide()
    }
  }

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenterId: any) {
    this.shoppingCenterIdToDelete = shoppingCenterId
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  deleteShCenter() {
    this.spinner.show()
    const body: any = {
      Name: "DeleteShoppingCenterFromBuyBox",
      Params: {
        BuyBoxId: this.BuyBoxId,
        ShoppingCenterId: this.shoppingCenterIdToDelete,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.modalService.dismissAll()

        this.getMarketSurveyShoppingCenter()
      },
      error: (error) => console.error("Error fetching APIs:", error),
    })
  }

  getMarketSurveyShoppingCenter() {
    this.spinner.show()
    const body: any = {
      Name: "GetMarketSurveyShoppingCenters",
      Params: {
        BuyBoxId: this.BuyBoxId,
      },
    }

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => this.handleSuccessResponse(data),
    })
  }

  private handleSuccessResponse(data: any) {
    this.shoppingCenters = data.json
    this.stateService.setShoppingCenters(data.json)

    this.getBuyBoxPlaces(this.BuyBoxId)
    this.showbackIds = []
    this.spinner.hide()
  }

  // Confirm deletion of Shopping Center
  confirmDeleteShoppingCenter(modal: NgbModalRef) {
    console.log(this.shoppingCenterIdToDelete)

    if (this.shoppingCenterIdToDelete !== null) {
      this.DeleteShoppingCenter(this.shoppingCenterIdToDelete).subscribe((res) => {
        this.getMarketSurveyShoppingCenter()

        this.BuyBoxPlacesAndShoppingCenter = this.BuyBoxPlacesAndShoppingCenter.filter(
          (center) => center.id !== this.shoppingCenterIdToDelete,
        )
        modal.close("Delete click")
        this.shoppingCenterIdToDelete = null
      })
    }
  }

  // Delete Shopping Center Function
  DeleteShoppingCenter(ShoppingCenterId: number) {
    const body: any = {
      Name: "DeleteShoppingCenterFromBuyBox",
      Params: {
        BuyboxId: this.BuyBoxId,
        ShoppingCenterId: this.showbackIdsJoin,
      },
    }
    return this.PlacesService.GenericAPI(body)
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type)
      // this.markerService.fetchAndDrawPolygon(th)
    })

    // let centerIds: any[] = [];
    // this.shoppingCenters.forEach((center) => {
    //   // centerIds.push(center.Id);
    //   if (center.Latitude && center.Longitude) {
    //     // this.markerService.fetchAndDrawPolygon(this.map, center.CenterCity, center.CenterState , center.Neighbourhood);
    //     if (this.shoppingCenters.indexOf(center) < 1) {
    //       this.markerService.fetchAndDrawPolygon(
    //         this.map,
    //         center.CenterCity,
    //         center.CenterState,
    //         center.Latitude,
    //         center.Longitude
    //       );
    //     }
    //   }
    // });

    // const centerIdsString = centerIds.join(',');
  }

  getPolygons() {
    const body: any = {
      Name: "GetBuyBoxSCsIntersectPolys",
      Params: {
        BuyBoxId: this.BuyBoxId,
        PolygonSourceId: 0,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json
      this.markerService.drawMultiplePolygons(this.map, this.Polygons)
    })
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray?.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData)
    })
  }

  onCheckboxChange(category: BuyboxCategory): void {
    this.markerService.toggleMarkers(this.map, category)
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1
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
        // if (center.ShoppingCenter?.Places) {
        center.Latitude = center.Latitude
        center.Longitude = center.Longitude
        // }
      })
    }
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds()
    const visibleMarkers = this.markerService?.getVisibleProspectMarkers(bounds)
    const visibleCoords = new Set(visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`))

    const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]

    // Update the cardsSideList inside NgZone
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
      console.warn("Invalid Latitude or Longitude for property:", property)
      return false
    }

    return bounds?.contains({ lat, lng })
  }

  onMouseEnter(place: any): void {
    const { Latitude, Longitude } = place
    const mapElement = document.getElementById("map") as HTMLElement

    if (!mapElement) return

    if (this.map) {
      this.map.setCenter({ lat: +Latitude, lng: +Longitude })
      this.map.setZoom(17)
    }
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place)
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place)
  }

  getAllBuyBoxComparables(buyboxId: number) {
    this.spinner.show()
    this.PlacesService.GetAllBuyBoxComparables(buyboxId).subscribe((data) => {
      this.anotherPlaces = data
      this.getAllMarker()
      this.spinner.hide()
    })
  }

  selectOption(option: any): void {
    this.selectedOption = option.status
    this.currentView = option.status
    this.isOpen = false
    localStorage.setItem("currentView", this.currentView)
  }

  goToPlace(place: any) {
    if (place.CenterAddress) {
      this.router.navigate([
        "/landing",
        place.ShoppingCenter?.Places ? place.ShoppingCenter.Places[0].Id : 0,
        place.Id,
        this.BuyBoxId,
        this.OrgId,
      ])
    } else {
      this.router.navigate(["/landing", place.Id, 0, this.BuyBoxId, this.OrgId])
    }
  }

  sanitizedUrl!: any
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

  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL)
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  trackByIndex(index: number, item: any): number {
    return index // Return the index to track by the position
  }

  StreetViewOnePlace!: boolean

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
    const streetViewElement = document.getElementById("street-view")
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(streetViewElement as HTMLElement, {
        position: { lat: lat, lng: lng },
        pov: { heading: heading, pitch: 0 }, // Dynamic heading and pitch
        zoom: 1,
      })
      this.addMarkerToStreetView(panorama, lat, lng)
    } else {
      console.error("Element with id 'street-view' not found in the DOM.")
    }
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number) {
    const svgPath =
      "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z"

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: panorama,
      icon: {
        path: svgPath,
        scale: 4,
        fillColor: "black",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 1,
      },
    })
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
      scrollable: true,
    })
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude)
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

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true

    if (!lat || !lng) {
      console.error("Latitude and longitude are required to display the map.")
      return
    }
    // Load Google Maps API libraries
    const { Map } = (await google.maps.importLibrary("maps")) as any
    const mapDiv = document.getElementById("mappopup") as HTMLElement

    if (!mapDiv) {
      console.error('Element with ID "mappopup" not found.')
      return
    }

    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    })

    // Create a new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: "Location Marker",
    })
  }

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString() // Format the number with commas
    }

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === "On Request") return "On Request"
      const priceNumber = Number.parseFloat(price)
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price // Remove decimal points and return the whole number
    }

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === "On Request") {
        return calculatedPrice // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${Number.parseFloat(originalPrice).toLocaleString()}/sq ft./year`

      // Inline styles can be adjusted as desired
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `
    }

    // Extract the places array
    const places = shoppingCenter?.ShoppingCenter?.Places || []

    // Collect building sizes if available
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter((size: any) => size !== undefined && size !== null && !isNaN(size))

    if (buildingSizes.length === 0) {
      // Handle case for a single shopping center without valid places
      const singleSize = shoppingCenter.BuildingSizeSf
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice)
        const resultPrice =
          leasePrice && leasePrice !== "On Request"
            ? appendInfoIcon(
                `$${formatNumberWithCommas(Math.floor((Number.parseFloat(leasePrice) * singleSize) / 12))}/month`,
                shoppingCenter.ForLeasePrice,
              )
            : "On Request"
        return `Unit Size: ${formatNumberWithCommas(singleSize)} sq ft.<br>Lease price: ${resultPrice}`
      }
      return null
    }

    // Calculate min and max size
    const minSize = Math.min(...buildingSizes)
    const maxSize = Math.max(...buildingSizes)

    // Find corresponding lease prices for min and max sizes
    const minPrice = places.find((place: any) => place.BuildingSizeSf === minSize)?.ForLeasePrice || "On Request"
    const maxPrice = places.find((place: any) => place.BuildingSizeSf === maxSize)?.ForLeasePrice || "On Request"

    // Format unit sizes
    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(maxSize)} sq ft.`

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === "On Request"
        ? "On Request"
        : appendInfoIcon(
            `$${formatNumberWithCommas(Math.floor((Number.parseFloat(minPrice) * minSize) / 12))}/month`,
            minPrice,
          )

    const formattedMaxPrice =
      maxPrice === "On Request"
        ? "On Request"
        : appendInfoIcon(
            `$${formatNumberWithCommas(Math.floor((Number.parseFloat(maxPrice) * maxSize) / 12))}/month`,
            maxPrice,
          )

    // Handle the lease price display logic
    let leasePriceRange
    if (formattedMinPrice === "On Request" && formattedMaxPrice === "On Request") {
      leasePriceRange = "On Request"
    } else if (formattedMinPrice === "On Request") {
      leasePriceRange = formattedMaxPrice
    } else if (formattedMaxPrice === "On Request") {
      leasePriceRange = formattedMinPrice
    } else if (formattedMinPrice === formattedMaxPrice) {
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`
  }

  getStandAloneLeasePrice(forLeasePrice: any, buildingSizeSf: any): string {
    // Ensure the values are numbers by explicitly converting them
    const leasePrice = Number(forLeasePrice)
    const size = Number(buildingSizeSf)

    // Check if the values are valid numbers
    if (!isNaN(leasePrice) && !isNaN(size) && leasePrice > 0 && size > 0) {
      // Calculate the lease price per month
      const calculatedPrice = Math.floor((leasePrice * size) / 12)

      // Format the calculated price with commas
      const formattedPrice = calculatedPrice.toLocaleString()

      // Format the original price in $X/sqft/Year format
      const formattedOriginalPrice = `$${leasePrice.toLocaleString()}/sq ft./year`

      // Return formatted result in a stacked layout with an info icon
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2; vertical-align:middle;">
        <b>Lease price:</b>
          <div style="font-size:14px; font-weight:600; color:#333;">
            ${formattedOriginalPrice}
          </div>
          <div style="font-size:12px; color:#666; margin-top:4px;">
            $${formattedPrice}/month 
           
          </div>
        </div>
      `
    } else {
      return "<b>Lease price:</b> On Request"
    }
  }

  getNeareastCategoryName(categoryId: number) {
    const categories = this.buyboxCategories.filter((x) => x.id == categoryId)
    return categories[0]?.name
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString()
    } else {
      return ""
    }
  }

  setDefaultView(viewValue: number) {
    this.selectedSS = viewValue
    this.stateService.setSelectedSS(viewValue)
  }

  GetBuyboxRelations() {
    const body = {
      Name: "GetBuyboxRelations",
      Params: {
        BuyBoxId: this.BuyBoxId,
      },
    }
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      console.log(data)
    })
  }

  // Comment functionality updated to include MarketSurveyId and prepare for API integration
  toggleReactions(shoppingId: number): void {
    this.showReactions[shoppingId] = !this.showReactions[shoppingId]
  }

  react(shopping: any, reactionType: string): void {
    this.reactions[shopping.Id] = reactionType
    this.showReactions[shopping.Id] = false
  }

  likeDirectly(shopping: any): void {
    this.react(shopping, this.reactions[shopping.Id] === "Like" ? "" : "Like")
    this.showReactions[shopping.Id] = false
    
    const likeButton = document.querySelector(`[data-shopping-id="${shopping.Id}"] .like-btn`)
    if (likeButton) {
      likeButton.classList.add("liked")
      setTimeout(() => {
        likeButton.classList.remove("liked")
      }, 300)
    }
  }

  getReaction(shopping: any): string {
    return this.reactions[shopping.Id] || ""
  }

  getTotalReactions(shopping: any): number {
    return this.reactions[shopping.Id] ? 1 : 0
  }
  copyLinkSocial(shopping: any) {
    // Generate a unique link for the shopping center
    const link = `localhost:4200/landing/0/${shopping.Id}/${this.BuyBoxId}/${this.OrgId}`
    // [RouterLink]="['/landing', 0, shopping.Id, BuyBoxId, OrgId]"
    // Copy the link to clipboard
    navigator.clipboard.writeText(link).then(
      () => {
        this.showToastMessage("Link copied to clipboard!")
      },
      (err) => {
        console.error("Could not copy text: ", err)
      },
    )
  }

  getPrimaryReaction(shopping: any): string {
    return this.reactions[shopping.Id] || "Like"
  }

  toggleComments(shopping: any): void {
    this.showComments[shopping.Id] = !this.showComments[shopping.Id]
  }

  addComment(marketSurveyId: number): void {
    if (this.newComments[marketSurveyId]) {
      const body = {
        Name: "CreateComment",
        Params: {
          MarketSurveyId: marketSurveyId,
          Comment: this.newComments[marketSurveyId],
          ParentCommentId: 0 // 0 for main comments
        }
      };
  
      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          const newComment: Comment = {
            id: response.id,
            text: this.newComments[marketSurveyId],
            user: 'Current User',
            parentId: null,
            replies: [],
            MarketSurveyId: marketSurveyId
          };
  
          if (!this.comments[marketSurveyId]) {
            this.comments[marketSurveyId] = [];
          }
  
          this.comments[marketSurveyId].push(newComment);
          this.newComments[marketSurveyId] = '';
          
          this.getMarketSurveyShoppingCenter();
        },
        error: (error: any) => {
          console.error('Error adding comment:', error);
        }
      });
    }
  }
  
  log(id:number){
    console.log(id)
  }

  addReply(marketSurveyId: number, parentCommentId: number): void {
    if (this.newReplies[parentCommentId]) {
      const body = {
        Name: "CreateComment",
        Params: {
          MarketSurveyId: marketSurveyId,
          Comment: this.newReplies[parentCommentId],
          ParentCommentId: parentCommentId,
        },
          
      };
      console.log(body),

      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          const newReply: Comment = {
            id: response.id,
            text: this.newReplies[parentCommentId],
            user: 'Current User',
            parentId: parentCommentId,
            replies: [],
            MarketSurveyId: marketSurveyId
          };
  
          const parentComment = this.findCommentById(this.comments[marketSurveyId], parentCommentId);
          if (parentComment) {
            parentComment.replies.push(newReply);
          }
  
          this.newReplies[parentCommentId] = '';
          this.replyingTo[marketSurveyId] = null;
  
          this.getMarketSurveyShoppingCenter();
        },
        error: (error: any) => {
          console.error('Error adding reply:', error);
        }
      });
    }
  }
  
    findCommentById(comments: Comment[], id: number): Comment | null {
    if (!comments) return null;
    
    for (const comment of comments) {
      if (comment.id === id) {
        return comment;
      }
      const foundInReplies = this.findCommentById(comment.replies, id);
      if (foundInReplies) {
        return foundInReplies;
      }
    }
    return null;
  }
  
  // You might need a method to fetch comments for each MarketSurveyId
  fetchComments(marketSurveyId: number) {
    // Implement the logic to fetch comments for a specific MarketSurveyId
    // and update this.comments[marketSurveyId] accordingly
  }
  // `localhost:4200/landing/0/${shopping.Id}/${this.BuyBoxId}/${this.OrgId}
  openAddContactModal(content: any): void {
    // Reset the form model
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
  @ViewChild('contactsModal', { static: true }) contactsModalTemplate: any;
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
        console.log('Contact added successfully:', data);
        this.newContact = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        };
        form.resetForm();
        this.modalService.dismissAll();
        // Refresh and reopen the contacts modal using the stored template reference
        this.openContactsModal(this.contactsModalTemplate);
      },
      error: (error: any) => {
        console.error('Error adding contact:', error);
        this.spinner.hide();
      },
    });
  }


  // common

  doubleTapLike(shopping: any, event: TouchEvent) {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - this.lastTap
    if (tapLength < 300 && tapLength > 0) {
      this.likeDirectly(shopping)
      const touch = event.touches[0]
      //this.createHeartAnimation(touch.clientX, touch.clientY)
      event.preventDefault()
    }
    this.lastTap = currentTime
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
      },
      error: (error: any) => {
        console.error('Error fetching Organization Contacts:', error);
        this.spinner.hide();
      },
    });
  }
  // createHeartAnimation(x: number, y: number) {
  //   const animationContainer = this.el.nativeElement.querySelector(".heart-animation-container")
  //   if (!animationContainer) return

  //   const svgNS = "http://www.w3.org/2000/svg"
  //   const svg = this.renderer.createElement("svg", svgNS)
  //   this.renderer.setAttribute(svg, "viewBox", "0 0 24 24")
  //   this.renderer.setAttribute(svg, "width", "100")
  //   this.renderer.setAttribute(svg, "height", "100")
  //   this.renderer.addClass(svg, "heart-animation")

  //   const path = this.renderer.createElement("path", svgNS)
  //   this.renderer.setAttribute(
  //     path,
  //     "d",
  //     "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  //   )
  //   this.renderer.setAttribute(path, "fill", "#ff4081")

  //   this.renderer.appendChild(svg, path)
  //   this.renderer.setStyle(svg, "position", "absolute")
  //   this.renderer.setStyle(svg, "left", `${x - 50}px`)
  //   this.renderer.setStyle(svg, "top", `${y - 50}px`)

  //   this.renderer.appendChild(animationContainer, svg)

  //   setTimeout(() => {
  //     this.renderer.removeChild(animationContainer, svg)
  //   }, 1000)
  // }

  onTouchStart(event: TouchEvent) {
    event.preventDefault()
  }

  showToastMessage(message: string) {
    this.toastMessage = message
    this.showToast = true
    setTimeout(() => {
      this.showToast = false
    }, 3000) // Hide the toast after 3 seconds
  }

  private CreateComment(shoppingId:any,comment: Comment, parentId:any) {
    // Implement your API call here using your service
    const body = {
      Name: "CreateComment",
      Params: {
        MarketSurveyId: comment.MarketSurveyId,
        Comment: comment.text,
        ParentCommentId: comment.parentId || 0
      }
    };
    return this.PlacesService.GenericAPI(body);
  }

  // findCommentById(comments: Comment[], id: number): Comment | null {
  //   for (const comment of comments) {
  //     if (comment.id === id) {
  //       return comment
  //     }
  //     const foundInReplies = this.findCommentById(comment.replies, id)
  //     if (foundInReplies) {
  //       return foundInReplies
  //     }
  //   }
  //   return null
  // }

  toggleReply(shopping: any, commentId: number): void {
    this.replyingTo[shopping.Id] = this.replyingTo[shopping.Id] === commentId ? null : commentId
    console.log(commentId)
  }

  hideReactions(shoppingId: number): void {
    setTimeout(() => {
      this.showReactions[shoppingId] = false
    }, 3000)
  }

  startReactionTimer(shoppingId: number): void {
    this.showReactions[shoppingId] = true
  }

  stopReactionTimer(shoppingId: number): void {
    clearTimeout(this.reactionTimers[shoppingId])
    delete this.reactionTimers[shoppingId]
  }

  private formatShareText(shopping: any): string {
    return `
${shopping.CenterName}

Check out ${shopping.CenterName} in ${shopping.CenterCity}, ${shopping.CenterState}!

Learn more at: ${window.location.href}
    `.trim()
  }
}

