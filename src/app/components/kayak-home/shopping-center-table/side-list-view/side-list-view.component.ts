import {
  Component,
  OnInit,
  Renderer2,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  NgZone,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  Input,
  OnDestroy,
  ApplicationRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from '../../../../../models/shoppingCenters';
import { DomSanitizer } from '@angular/platform-browser';
import { StateService } from '../../../../services/state.service';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShoppingCenter } from 'src/models/buyboxShoppingCenter';
import { ViewManagerService } from 'src/app/services/view-manager.service';
import { forkJoin, tap, catchError, of, Subject, takeUntil } from 'rxjs';

declare const google: any

@Component({
  selector: "app-side-list-view",
  templateUrl: "./side-list-view.component.html",
  styleUrls: ["./side-list-view.component.css"],
})
export class SideListViewComponent implements OnInit, OnChanges, OnDestroy {
  @Output() highlightMarker = new EventEmitter<any>()
  @Output() unhighlightMarker = new EventEmitter<any>()

  General: General = new General()
  BuyBoxId!: any
  OrgId!: any
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

  selectedOption = 2
  buyboxCategories: BuyboxCategory[] = []
  cardsSideList: any[] = []
  selectedIdCard: number | null = null
  placesRepresentative: boolean | undefined
  showbackIds: number[] = []
  isOpen = false
  currentView: any
  mapViewOnePlacex = false
  sanitizedUrl!: any
  StreetViewOnePlace!: boolean
  shoppingCenters: Center[] = []
  buyboxPlaces: BbPlace[] = []
  savedMapView: any
  standAlone: Place[] = []
  map: any
  markers: any[] = []
  infoWindows: any[] = []
  showbackIdsJoin: any
  shoppingCenterIdToDelete: number | null = null
  BuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = []
  selectedState = "0"
  selectedCity = ""
  BuyBoxName = ""

  ShareOrg: any[] = []
  activeComponent = "Properties"
  selectedTab = "Properties"
  shoppingCenter: any
  @Input() isVisible = false
  dataLoaded = false

  // Add a destroy subject for cleanup
  private destroy$ = new Subject<void>()
  private dataInitialized = false
  private mapInitialized = false
  private boundsCheckAttempts = 0
  private maxBoundsCheckAttempts = 10
  private boundsCheckInterval: any = null
  private isFirstLoad = true
  private initialBoundsApplied = false
  private scheduledUpdates: any[] = []
  private markersCreated = false
  private mapReadyResolver: ((value: boolean) => void) | null = null
  private mapReadyPromise: Promise<boolean> | null = null
  private mapInitPromise: Promise<boolean> | null = null
  private mapInitResolver: ((value: boolean) => void) | null = null

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private sanitizer: DomSanitizer,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private viewManagerService: ViewManagerService,
    private appRef: ApplicationRef,
  ) {
    // Create a promise that will resolve when the map is ready
    this.mapReadyPromise = new Promise<boolean>((resolve) => {
      this.mapReadyResolver = resolve
    })
  }

  ngOnInit(): void {
    console.log("SideListViewComponent initialized")
    this.General = new General()
    this.selectedState = ""
    this.selectedCity = ""

    // Check if this is the first load or navigation
    const lastVisitTimestamp = localStorage.getItem("sideListViewLastVisit")
    const currentTime = Date.now()

    if (!lastVisitTimestamp) {
      // First time ever loading the component
      this.isFirstLoad = true
    } else {
      const timeSinceLastVisit = currentTime - Number.parseInt(lastVisitTimestamp)
      // If it's been more than 5 minutes, treat as first load
      this.isFirstLoad = timeSinceLastVisit > 300000
    }

    // Update the last visit timestamp
    localStorage.setItem("sideListViewLastVisit", currentTime.toString())

    console.log(`Component load type: ${this.isFirstLoad ? "First Load" : "Navigation"}`)

    // Subscribe to route params only once
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid
      this.OrgId = params.orgId
      this.BuyBoxName = params.buyboxName
      localStorage.setItem("BuyBoxId", this.BuyBoxId)
      localStorage.setItem("OrgId", this.OrgId)

      // Only initialize data if not already done
      if (!this.dataInitialized) {
        this.dataInitialized = true
        this.initializeData()
      }
    })

    this.currentView = localStorage.getItem("currentViewDashBord") || "5"

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView),
    )

    if (selectedOption) {
      this.selectedOption = selectedOption.status
    }

    this.activeComponent = "Properties"
    this.selectedTab = "Properties"

    // Load saved map view if available
    this.savedMapView = localStorage.getItem("mapView")
  }

  async initializeData() {
    try {
      console.log("Initializing data...")
      this.spinner.show()

      // Use a single API call to get all data
      forkJoin({
        categories: this.viewManagerService.getBuyBoxCategories(this.BuyBoxId),
        centers: this.viewManagerService.getShoppingCenters(this.BuyBoxId),
        places: this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId),
        org: this.viewManagerService.getOrganizationById(this.OrgId),
      })
        .pipe(
          tap((result) => {
            console.log("Data loaded successfully")
            this.buyboxCategories = result.categories
            this.shoppingCenters = result.centers
            this.buyboxPlaces = result.places
            this.ShareOrg = result.org

            // Update state service with fetched data
            this.stateService.setBuyboxCategories(this.buyboxCategories)
            this.stateService.setShoppingCenters(this.shoppingCenters)
            this.stateService.setBuyboxPlaces(this.buyboxPlaces)
            this.stateService.setShareOrg(this.ShareOrg)

            // Process categories
            this.buyboxCategories.forEach((category) => {
              category.isChecked = false
              category.places = this.buyboxPlaces?.filter((place) =>
                place.RetailRelationCategories?.some((x) => x.Id === category.id),
              )
            })

            // Initially show all properties
            const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
            this.cardsSideList = allProperties
            console.log(`Initial cards list populated with ${this.cardsSideList.length} items`)
          }),
          catchError((error) => {
            console.error("Error initializing data:", error)
            return of(null)
          }),
          takeUntil(this.destroy$),
        )
        .subscribe(
          () => {
            this.dataLoaded = true

            // Initialize map only after data is loaded
            if (!this.mapInitialized) {
              this.mapInitialized = true
              this.getAllMarker()
            } else {
              // If map is already initialized, ensure cards are displayed
              this.ensureCardsDisplayed()
            }
            this.cdr.detectChanges()
          },
          null,
          () => this.spinner.hide(),
        )
    } catch (error) {
      console.error("Error in initializeData:", error)
      // Ensure cards are displayed even if there's an error
      this.ensureCardsDisplayed()
      this.spinner.hide()
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    const categories = this.buyboxCategories.filter((x) => x.id == categoryId)
    return categories[0]?.name || ""
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString()
    }

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === "On Request") return "On Request"
      const priceNumber = Number.parseFloat(price)
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price
    }

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === "On Request") {
        return calculatedPrice
      }
      const formattedOriginalPrice = `$${Number.parseFloat(originalPrice).toLocaleString()}/sq ft./year`

      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `
    }

    const places = shoppingCenter?.ShoppingCenter?.Places || []
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter((size: any) => size !== undefined && size !== null && !isNaN(size))

    if (buildingSizes.length === 0) {
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
      return ""
    }

    const minSize = Math.min(...buildingSizes)
    const maxSize = Math.max(...buildingSizes)

    const minPrice = places.find((place: any) => place.BuildingSizeSf === minSize)?.ForLeasePrice || "On Request"
    const maxPrice = places.find((place: any) => place.BuildingSizeSf === maxSize)?.ForLeasePrice || "On Request"

    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(maxSize)} sq ft.`

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

    let leasePriceRange
    if (formattedMinPrice === "On Request" && formattedMaxPrice === "On Request") {
      leasePriceRange = "On Request"
    } else if (formattedMinPrice === "On Request") {
      leasePriceRange = formattedMaxPrice
    } else if (formattedMaxPrice === "On Request") {
      leasePriceRange = formattedMinPrice
    } else if (formattedMinPrice === formattedMaxPrice) {
      leasePriceRange = formattedMinPrice
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`
  }

  toggleShortcutsCard(id: number | null): void {
    this.selectedIdCard = id
  }

  toggleShortcuts(id: number, close?: string): void {
    if (close === "close") {
      this.selectedIdCard = null
    }
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1
  }

  selectOption(option: any): void {
    this.selectedOption = option.status
    this.currentView = option.status
    this.isOpen = false
    localStorage.setItem("currentViewDashBord", this.currentView)
  }

  onMouseHighlight(place: any): void {
    this.highlightMarker.emit(place)
  }

  onMouseLeaveHighlight(place: any): void {
    this.unhighlightMarker.emit(place)
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

    if (!lat || !lng) {
      console.error("Latitude and longitude are required to display the map.")
      return
    }

    try {
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
    } catch (error) {
      console.error("Error loading Google Maps:", error)
    }
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
      // Use a timeout to ensure the DOM is ready
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
    try {
      const streetViewElement = document.getElementById("street-view")
      if (streetViewElement) {
        const panorama = new google.maps.StreetViewPanorama(streetViewElement as HTMLElement, {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 },
          zoom: 1,
        })
        this.addMarkerToStreetView(panorama, lat, lng)
      } else {
        console.error("Element with id 'street-view' not found in the DOM.")
      }
    } catch (error) {
      console.error("Error creating street view:", error)
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

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  deleteShopping(id: number): void {
    if (this.showbackIds.includes(id)) {
      this.CancelOneDelete(id)
    } else {
      this.showbackIds.push(id)
    }
  }

  CancelOneDelete(id: number): void {
    this.showbackIds = this.showbackIds.filter((item) => item !== id)
  }

  CancelDelete(): void {
    this.showbackIds = []
  }

  ArrOfDelete(modalTemplate: TemplateRef<any>) {
    this.showbackIdsJoin = this.showbackIds.join(",")
    this.openDeleteShoppingCenterModal(modalTemplate, this.showbackIdsJoin)
  }

  DeletedSC: any

  openDeleteShoppingCenterModal(modalTemplate: TemplateRef<any>, shoppingCenter: any) {
    this.DeletedSC = shoppingCenter
    this.shoppingCenterIdToDelete = shoppingCenter.Id
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: "modal-basic-title",
    })
  }

  async getAllMarker() {
    try {
      console.log("getAllMarker called")
      this.spinner.show()

      // Create a promise that will resolve when the map is fully initialized
      this.mapInitPromise = new Promise<boolean>((resolve) => {
        this.mapInitResolver = resolve
      })

      // Check if we have data to display
      if (
        (!this.shoppingCenters || this.shoppingCenters.length === 0) &&
        (!this.standAlone || this.standAlone.length === 0)
      ) {
        console.warn("No data available to display on map")
        this.spinner.hide()
        return
      }

      // Load Google Maps
      let Map
      try {
        const mapsLib = await google.maps.importLibrary("maps")
        Map = mapsLib.Map
      } catch (error) {
        console.error("Error loading Google Maps library:", error)
        this.ensureCardsDisplayed()
        this.spinner.hide()
        return
      }

      const mapElement = document.getElementById("map") as HTMLElement
      if (!mapElement) {
        console.error('Element with id "map" not found.')
        this.ensureCardsDisplayed()
        this.spinner.hide()
        return
      }

      // Initialize map
      try {
        if (this.savedMapView) {
          const { lat, lng, zoom } = JSON.parse(this.savedMapView)
          this.map = new Map(mapElement, {
            center: { lat: lat, lng: lng },
            zoom: zoom,
            mapId: "1234567890",
          })
        } else {
          // Default center if we have data
          const defaultLat =
            this.shoppingCenters?.length > 0
              ? this.shoppingCenters[0]?.Latitude
              : this.standAlone?.length > 0
                ? this.standAlone[0]?.Latitude
                : 0

          const defaultLng =
            this.shoppingCenters?.length > 0
              ? this.shoppingCenters[0]?.Longitude
              : this.standAlone?.length > 0
                ? this.standAlone[0]?.Longitude
                : 0

          this.map = new Map(mapElement, {
            center: { lat: defaultLat, lng: defaultLng },
            zoom: 8,
            mapId: "1234567890",
          })
        }
      } catch (error) {
        console.error("Error initializing map:", error)
        this.ensureCardsDisplayed()
        this.spinner.hide()
        return
      }

      // CRITICAL FIX: Add multiple event listeners for different map events
      // This ensures we catch the moment when the map is fully ready
      this.map.addListener("idle", () => {
        this.ngZone.run(() => {
          console.log("Map idle event triggered")
          this.onMapDragEnd(this.map)

          // Resolve the map initialization promise
          if (this.mapInitResolver) {
            this.mapInitResolver(true)
            this.mapInitResolver = null
          }
        })
      })
      this.map.addListener("zoom_changed", () => this.onMapZoomChanged())
      this.map.addListener("tilesloaded", () => {
        this.ngZone.run(() => {
          console.log("Map tiles loaded")

          // Also resolve the promise here as a backup
          if (this.mapInitResolver) {
            this.mapInitResolver(true)
            this.mapInitResolver = null
          }

          if (this.isFirstLoad && !this.initialBoundsApplied) {
            this.updateCardsSideList(this.map, true)
          }
        })
      })

      this.map.addListener("bounds_changed", () => {
        this.ngZone.run(() => {
          console.log("Map bounds changed")
          if (this.isFirstLoad && !this.initialBoundsApplied) {
            this.updateCardsSideList(this.map, true)
          }
        })
      })

      // Create markers for shopping centers
      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, "Shopping Center")
      }

      // Create markers for stand-alone properties
      if (this.standAlone && this.standAlone.length > 0) {
        this.createMarkers(this.standAlone, "Stand Alone")
      }

      // Create custom markers for categories
      if (this.buyboxCategories && this.buyboxCategories.length > 0) {
        this.createCustomMarkers(this.buyboxCategories)
      }

      this.markersCreated = true

      // CRITICAL FIX: For first load, use a different strategy
      if (this.isFirstLoad) {
        console.log("First load detected - using special initialization")

        // Wait for the map to be fully initialized before updating cards
        this.mapInitPromise.then(() => {
          console.log("Map is fully initialized, updating cards")
          this.ngZone.run(() => {
            this.updateCardsSideList(this.map, true)
          })
        })

        // Also schedule multiple updates at different times as a fallback
        this.scheduleMultipleUpdates()

        // And start the polling mechanism as a final fallback
        this.startBoundsCheckInterval()
      } else {
        // For navigation, just do a single update after a short delay
        setTimeout(() => {
          this.ngZone.run(() => {
            this.updateCardsSideList(this.map)
          })
        }, 500)
      }
    } catch (error) {
      console.error("Error loading markers:", error)
      this.ensureCardsDisplayed()
    } finally {
      this.spinner.hide()
    }
  }

  private onMapZoomChanged(): void {
    // Always run inside NgZone to ensure proper change detection
    this.ngZone.run(() => {
      console.log("Map zoom changed, updating cards")
      this.saveMapView(this.map)
      this.updateCardsSideList(this.map)
      
      // Force change detection
      this.cdr.detectChanges()
      this.appRef.tick()
    })
  }
  // Schedule multiple updates at different times
  private scheduleMultipleUpdates() {
    const updateTimes = [500, 1000, 1500, 2000, 3000, 5000]

    updateTimes.forEach((time) => {
      const timeoutId = setTimeout(() => {
        if (!this.initialBoundsApplied) {
          console.log(`Scheduled update at ${time}ms`)
          this.ngZone.run(() => {
            this.updateCardsSideList(this.map, true)
          })
        }
      }, time)

      this.scheduledUpdates.push(timeoutId)
    })
  }

  // Start polling for bounds check
  private startBoundsCheckInterval() {
    console.log("Starting bounds check interval")

    // Clear any existing interval
    if (this.boundsCheckInterval) {
      clearInterval(this.boundsCheckInterval)
    }

    this.boundsCheckAttempts = 0

    // Check bounds every 500ms with exponential backoff
    this.boundsCheckInterval = setInterval(() => {
      this.boundsCheckAttempts++

      // Use exponential backoff for logging to reduce console spam
      if (this.boundsCheckAttempts === 1 || this.boundsCheckAttempts % 2 === 0) {
        console.log(`Bounds check attempt ${this.boundsCheckAttempts}`)
      }

      if (this.boundsCheckAttempts >= this.maxBoundsCheckAttempts) {
        console.log("Max bounds check attempts reached, clearing interval")
        clearInterval(this.boundsCheckInterval)
        this.boundsCheckInterval = null

        // If we've reached max attempts and still haven't applied bounds,
        // force an update with all properties as a fallback
        if (!this.initialBoundsApplied) {
          this.ngZone.run(() => {
            console.log("Forcing fallback to all properties after max attempts")
            const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
            this.cardsSideList = allProperties
            this.initialBoundsApplied = true
            this.cdr.detectChanges()
            this.appRef.tick()
          })
        }
        return
      }

      // Run outside NgZone to avoid triggering change detection
      this.ngZone.runOutsideAngular(() => {
        if (this.map && this.map.getBounds && this.markersCreated) {
          const bounds = this.map.getBounds()
          if (bounds) {
            console.log("Map bounds available, updating cards")

            // Run the actual update inside NgZone
            this.ngZone.run(() => {
              this.updateCardsSideList(this.map, true)

              // If we successfully updated based on bounds, stop checking
              if (this.initialBoundsApplied) {
                clearInterval(this.boundsCheckInterval)
                this.boundsCheckInterval = null
              }
            })
          }
        }
      })
    }, 500)

    // Safety cleanup after 10 seconds
    setTimeout(() => {
      if (this.boundsCheckInterval) {
        console.log("Safety cleanup of bounds check interval")
        clearInterval(this.boundsCheckInterval)
        this.boundsCheckInterval = null
      }
    }, 10000)
  }

  createMarkers(markerDataArray: any[], type: string) {
    if (!markerDataArray || markerDataArray.length === 0) return

    markerDataArray.forEach((markerData) => {
      if (markerData && markerData.Latitude && markerData.Longitude) {
        this.markerService.createMarker(this.map, markerData, type)
      }
    })
  }

  createCustomMarkers(markerDataArray: any[]) {
    if (!markerDataArray || markerDataArray.length === 0) return

    markerDataArray.forEach((categoryData) => {
      if (categoryData) {
        this.markerService.createCustomMarker(this.map, categoryData)
      }
    })
  }

  private onMapDragEnd(map: any) {
    if (!map) return

    // Run inside NgZone to ensure proper change detection
    this.ngZone.run(() => {
      this.saveMapView(map)
      this.updateShoppingCenterCoordinates()
      this.updateCardsSideList(map)
    })
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      this.shoppingCenters.forEach((center) => {
        if (center) {
          center.Latitude = center.Latitude
          center.Longitude = center.Longitude
        }
      })
    }
  }

// Replace your current updateCardsSideList method with this improved version:

// Replace your current updateCardsSideList method with this improved version:

private updateCardsSideList(map: any, isInitialLoad = false): void {
  // Always run this method inside NgZone to ensure proper change detection
  this.ngZone.run(() => {
    try {
      console.log(`updateCardsSideList called, isInitialLoad: ${isInitialLoad}`)

      // CRITICAL FIX: Check if map is fully initialized
      const isMapInitialized = map && map.getBounds && typeof map.getBounds === "function"

      // If map isn't ready, show all cards instead of none
      if (!isMapInitialized) {
        console.log("Map or bounds not available")
        const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
        this.cardsSideList = allProperties
        console.log("Cards displayed (no map):", this.cardsSideList.length)
        this.cdr.detectChanges()
        this.appRef.tick() // Force application update
        return
      }

      // Try to get bounds safely
      let bounds
      try {
        bounds = isMapInitialized ? map.getBounds() : null
      } catch (e) {
        console.error("Error getting map bounds:", e)
        bounds = null
      }

      if (!bounds) {
        console.log("No bounds available")
        const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
        this.cardsSideList = allProperties
        console.log("Cards displayed (no bounds):", this.cardsSideList.length)
        this.cdr.detectChanges()
        this.appRef.tick() // Force application update
        return
      }

      // The rest of your existing method...
      const propertiesInBounds = this.getPropertiesInBounds(bounds)
      console.log(`Found ${propertiesInBounds.length} properties in bounds`)

      if (propertiesInBounds.length > 0) {
        // Update the cards list with properties in bounds
        this.cardsSideList = propertiesInBounds
        console.log(`Cards updated: ${this.cardsSideList.length} cards visible`)

        // Mark that we've successfully applied bounds filtering
        if (isInitialLoad) {
          this.initialBoundsApplied = true
        }
      } else {
        // Your existing fallback logic...
      }

      // Force change detection AND application update
      this.cdr.detectChanges()
      this.appRef.tick() // This is critical for ensuring the UI updates
    } catch (error) {
      console.error("Error updating cards list:", error)
      // On error, show all cards as fallback
      const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
      this.cardsSideList = allProperties
      console.log("Cards displayed (error fallback):", this.cardsSideList.length)
      this.cdr.detectChanges()
      this.appRef.tick() // Force application update
    }
  })
}

  // Get properties that are within the current map bounds
  private getPropertiesInBounds(bounds: any): any[] {
    if (!bounds) return []

    const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]

    // CRITICAL FIX: Use a more efficient approach to check bounds
    return allProperties.filter((property) => {
      if (!property || !property.Latitude || !property.Longitude) {
        return false
      }

      try {
        const lat = Number.parseFloat(property.Latitude)
        const lng = Number.parseFloat(property.Longitude)

        if (isNaN(lat) || isNaN(lng)) {
          return false
        }

        // Create a LatLng object for more accurate bounds checking
        const position = new google.maps.LatLng(lat, lng)
        return bounds.contains(position)
      } catch (error) {
        console.error("Error checking if property is in bounds:", error)
        return false
      }
    })
  }

  // New method to directly get visible markers from the map
  private getVisibleMarkersDirectly(map: any, bounds: any): any[] {
    if (!map || !bounds) return []

    try {
      // Get all markers from the map
      const allMarkers: any[] = []

      // Access the map's overlays (this is implementation-specific and may need adjustment)
      if (map.overlays && map.overlays.length > 0) {
        map.overlays.forEach((overlay: any) => {
          if (overlay instanceof google.maps.Marker) {
            const position = overlay.getPosition()
            if (position && bounds.contains(position)) {
              allMarkers.push({
                lat: position.lat(),
                lng: position.lng(),
              })
            }
          }
        })
      }

      return allMarkers
    } catch (error) {
      console.error("Error getting visible markers directly:", error)
      return []
    }
  }

  // Helper method to filter and update cards
  private filterAndUpdateCards(visibleCoords: Set<string>, bounds: any, isInitialLoad: boolean): void {
    const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]

    // Filter properties that are visible on the map
    const visibleProperties = allProperties.filter(
      (property) =>
        property &&
        property.Latitude &&
        property.Longitude &&
        (visibleCoords.has(`${property.Latitude},${property.Longitude}`) || this.isWithinBounds(property, bounds)),
    )

    // Update the cards list
    if (visibleProperties.length > 0) {
      this.cardsSideList = visibleProperties
      console.log(`Cards updated: ${this.cardsSideList.length} cards visible`)
    } else {
      // If no properties are visible, show all properties
      this.cardsSideList = allProperties
      console.log(`No visible properties, showing all ${this.cardsSideList.length} cards`)
    }

    // Force change detection
    this.cdr.detectChanges()

    // For initial load, we need to force the application to update
    if (isInitialLoad) {
      this.appRef.tick()
    }
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    if (!property || !bounds) return false

    const lat = Number.parseFloat(property.Latitude)
    const lng = Number.parseFloat(property.Longitude)

    if (isNaN(lat) || isNaN(lng)) {
      return false
    }

    return bounds.contains({ lat, lng })
  }

  private saveMapView(map: any): void {
    if (!map || !map.getCenter) return

    try {
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
    } catch (error) {
      console.error("Error saving map view:", error)
    }
  }

  confirmDeleteShoppingCenter(modal: NgbModalRef) {
    if (this.shoppingCenterIdToDelete !== null) {
      this.deleteShCenter()
      modal.close("Delete click")
    }
  }

  async deleteShCenter() {
    if (!this.shoppingCenterIdToDelete) return

    // Optimistically update UI
    this.cardsSideList = this.cardsSideList.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x,
    )

    try {
      this.spinner.show()
      await this.viewManagerService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete)
      this.modalService.dismissAll()

      // Remove deleted item from lists
      this.shoppingCenters = this.shoppingCenters.filter((center) => center.Id !== this.shoppingCenterIdToDelete)

      this.cardsSideList = this.cardsSideList.filter((item) => item.Id !== this.shoppingCenterIdToDelete)

      this.showbackIds = this.showbackIds.filter((id) => id !== this.shoppingCenterIdToDelete)

      this.shoppingCenterIdToDelete = null

      // Update state service
      this.stateService.setShoppingCenters(this.shoppingCenters)

      // Force change detection
      this.cdr.detectChanges()
    } catch (error) {
      console.error("Error deleting shopping center:", error)

      // Revert optimistic update on error
      this.cardsSideList = this.cardsSideList.map((x) =>
        x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: false } : x,
      )
    } finally {
      this.spinner.hide()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["isVisible"] && this.isVisible && !this.dataLoaded) {
      // Only reload if data isn't already loaded
      this.initializeData()
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and resources
    this.destroy$.next()
    this.destroy$.complete()

    // Clean up bounds check interval if it exists
    if (this.boundsCheckInterval) {
      clearInterval(this.boundsCheckInterval)
      this.boundsCheckInterval = null
    }

    // Clear any scheduled updates
    this.scheduledUpdates.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.scheduledUpdates = []

    // Clean up Google Maps resources
    if (this.map) {
      // Remove event listeners
      google.maps.event.clearInstanceListeners(this.map)
      this.map = null
    }

    // Clear any open modals
    this.modalService.dismissAll()
  }

  private ensureCardsDisplayed(): void {
    // Always run inside NgZone
    this.ngZone.run(() => {
      // If cards list is empty but we have data, populate it
      if (
        (!this.cardsSideList || this.cardsSideList.length === 0) &&
        ((this.shoppingCenters && this.shoppingCenters.length > 0) || (this.standAlone && this.standAlone.length > 0))
      ) {
        const allProperties = [...(this.shoppingCenters || []), ...(this.standAlone || [])]
        this.cardsSideList = allProperties
        console.log("Cards forcibly displayed:", this.cardsSideList.length)

        // Force change detection
        this.cdr.detectChanges()
        this.appRef.tick()
      }
    })
  }

  // Add this method to the component to manually trigger change detection
  public forceUpdate(): void {
    this.ngZone.run(() => {
      this.ensureCardsDisplayed()
      this.cdr.detectChanges()
      this.appRef.tick()
    })
  }
}

