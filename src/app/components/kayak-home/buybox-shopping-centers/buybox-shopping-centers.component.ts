import {
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/models/domain';
import { PlacesService } from 'src/app/services/places.service';
import {
  BuyBoxCityState,
  ShoppingCenter,
} from 'src/models/buyboxShoppingCenter';
declare const google: any;

@Component({
  selector: 'app-buybox-shopping-centers',
  templateUrl: './buybox-shopping-centers.component.html',
  styleUrls: ['./buybox-shopping-centers.component.css'],
})
export class BuyboxShoppingCentersComponent implements OnInit {
  buyBoxId!: number | null;
  General!: General;
  BuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = [];
  @ViewChild('deleteShoppingCenterModal')
  deleteShoppingCenterModal!: TemplateRef<any>;
  @ViewChild('deletePlaceModal') deletePlaceModal!: TemplateRef<any>;
  // Variables to store IDs to delete
  shoppingCenterIdToDelete: number | null = null;
  placeIdToDelete: number | null = null;
  BuyBoxCitiesStates!: BuyBoxCityState[];
  StateCodes: string[] = [];
  filteredCities: string[] = [];
  // Selected filters
  selectedState: string = '0';
  selectedCity: string = '';

  // Filtered data
  filteredBuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = [];
  expandedShoppingCenters: Set<number> = new Set<number>();
  selectedPlaceStreetViewURL: string = '';
  mapViewOnePlacex: boolean = false;

  selectedSiteSelectionReason: string = '';
  selectedShoppingCenterId: number | null = null;
  // m7taga Api gdida <>
  selectedShoppingCenter: any = {}; // Hold the selected shopping center for editing
  // shoppingCenterEdited: NewShoppingCenter[] = [];
  nearestRetails: { name: string; distance: number; name1: string }[] = [];
  // BuyBoxWorkSpaces:any;
  selectedId: number | null = null;
  toggleShortcuts(id: number, close?: string): void {
    if (close === 'close') {
      this.selectedId = null;
    } else {
      this.selectedId = this.selectedId === id ? null : id;
    }
  }
  @Output() bindClicked: EventEmitter<void> = new EventEmitter<void>();
  triggerBindAction() {
    this.bindClicked.emit(); // ترسل الحدث للمكون الرئيسي
  }
  selectedIdT: number | null = null;
  toggleT(id: number, close?: string): void {
    if (close === 'closed') {
      this.selectedIdT = null;
    } else {
      this.selectedIdT = this.selectedIdT === id ? null : id;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    const isInsideMenu = clickedElement.closest('.shortcuts_icon');
    const isEllipsisButton = clickedElement.closest('.ellipsis_icon');
    const isInsideMenuT = clickedElement.closest('.shortcuts_iconT');
    const isEllipsisButtonT = clickedElement.closest('.ellipsis_iconT');

    if (!isInsideMenu && !isEllipsisButton) {
      this.selectedId = null;
    } else if (!isInsideMenuT && !isEllipsisButtonT) {
      this.selectedIdT = null;
    }
  }

  constructor(
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  showAlert(message: string): void {
    alert(message);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });

    this.getBuyBoxDetails();
    this.GetWizardBuyBoxCities();
    this.selectedState = '';
    this.selectedCity = '';
    this.applyFilters();
  }

  getBuyBoxDetails() {
    let body: any = {
      Name: 'GetAllBuyBoxPlaces',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe(
      (res) => {
        this.BuyBoxPlacesAndShoppingCenter =
          (res.json as ShoppingCenter[]) || [];
        // console.log(
        //   'BuyBoxPlacesAndShoppingCenter',
        //   this.BuyBoxPlacesAndShoppingCenter
        // );
        if (
          this.BuyBoxPlacesAndShoppingCenter &&
          this.BuyBoxPlacesAndShoppingCenter.length
        ) {
          // Compute hasSiteSelectionReason for each shopping center
          this.BuyBoxPlacesAndShoppingCenter.forEach((shoppingCenter) => {
            shoppingCenter.hasSiteSelectionReason =
              shoppingCenter.MarketSurveyShoppingCenters?.some(
                (center) =>
                  center.SiteSelectionReason &&
                  center.SiteSelectionReason.trim() !== ''
              );
          });
          this.filteredBuyBoxPlacesAndShoppingCenter = [
            ...this.BuyBoxPlacesAndShoppingCenter,
          ];
        }
      },
      (error) => {
        console.error('Error fetching BuyBoxPlacesAndShoppingCenter:', error);
      }
    );
  }
  GetWizardBuyBoxCities() {
    let body: any = {
      Name: 'GetWizardBuyBoxCities',
      Params: { buyboxid: this.buyBoxId },
    };
    this.PlacesService.GenericAPI(body).subscribe((res) => {
      this.BuyBoxCitiesStates = res.json as BuyBoxCityState[];
      // console.log('this.BuyBoxCitiesStates', this.BuyBoxCitiesStates);

      this.getStates(this.BuyBoxCitiesStates);
    });
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
  // Extract unique states with normalization
  // Extract unique states with normalization
  getStates(list: BuyBoxCityState[]) {
    this.StateCodes = Array.from(
      new Set(
        list
          .map((item) => item.state.trim().toUpperCase()) // Normalize states
          .filter((code) => !!code) // Remove empty strings
      )
    ).sort();

    // console.log('StateCodes:', this.StateCodes);
  }
  // Handle State selection
  // Handle State selection
  onStateChange(event: any) {
    const value = event.target.value;
    console.log(value);

    if (value === '') {
      this.selectedState = '';
      this.selectedCity = '';
      this.filteredCities = [];
      this.filteredBuyBoxPlacesAndShoppingCenter = [...this.BuyBoxPlacesAndShoppingCenter];
    } else {
      this.filteredCities = Array.from(
        new Set(
          this.BuyBoxCitiesStates.filter(
            (item) =>
              item.state.trim().toUpperCase() === value.trim().toUpperCase()
          ).map((item) => item.city)
        )
      ).sort();
    }

    this.selectedCity = '';
    this.applyFilters();
  }


  // Handle City selection
  onCityChange() {
    this.applyFilters();
  }
  // Apply Filters with Case-Insensitive Matching

  applyFilters() {
    if (!this.selectedState && !this.selectedCity) {
      this.filteredBuyBoxPlacesAndShoppingCenter = [...this.BuyBoxPlacesAndShoppingCenter];
      return;
    }

    this.filteredBuyBoxPlacesAndShoppingCenter =
      this.BuyBoxPlacesAndShoppingCenter.filter((center) => {
        const centerState = center.CenterState.trim().toUpperCase();
        const selectedState = this.selectedState?.trim().toUpperCase() || '';
        const centerCity = center.CenterCity.trim().toLowerCase();
        const selectedCity = this.selectedCity?.trim().toLowerCase() || '';

        const matchesState = this.selectedState
          ? centerState === selectedState
          : true;
        const matchesCity = this.selectedCity
          ? centerCity === selectedCity
          : true;

        return matchesState && matchesCity;
      });
  }

  openShoppingCenterStreetViewModal(
    content: TemplateRef<any>,
    streetViewURL: string
  ): void {
    if (!streetViewURL) {
      console.error('Street View URL is missing!');
      return;
    }
    // Open the modal
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
    // Wait for the modal to render before accessing the DOM
    setTimeout(() => {
      const container = document.getElementById('street-view-modal');
      if (!container) {
        console.error('Street View Container is not initialized.');
        return;
      }
      // Clear previous content and set the iframe
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = streetViewURL;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none'; // Optional: To remove border from iframe
      container.appendChild(iframe);
    }, 200);
  }
  // Function to open Shopping Center delete modal
  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenterId: number
  ) {
    this.shoppingCenterIdToDelete = shoppingCenterId;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }
  // Function to open Place delete modal
  openDeletePlaceModal(modalTemplate: TemplateRef<any>, placeId: number) {
    this.placeIdToDelete = placeId;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }
  // Confirm deletion of Shopping Center
  confirmDeleteShoppingCenter(modal: NgbModalRef) {
    if (this.shoppingCenterIdToDelete !== null) {
      this.DeleteShoppingCenterFromBuyBox(
        this.shoppingCenterIdToDelete
      ).subscribe(
        (res) => {
          // console.log(
          //   'DeleteShoppingCenterFromBuyBox',
          //   JSON.stringify(res.json)
          // );
          // Remove the Shopping Center from the local array
          this.BuyBoxPlacesAndShoppingCenter =
            this.BuyBoxPlacesAndShoppingCenter.filter(
              (center) => center.id !== this.shoppingCenterIdToDelete
            );
          modal.close('Delete click');
          this.shoppingCenterIdToDelete = null;
          this.getBuyBoxDetails();
        },
        (error) => {
          console.error('Error deleting shopping center:', error);
          modal.dismiss('Error');
        }
      );
    }
  }
  // Confirm deletion of Place
  confirmDeletePlace(modal: NgbModalRef) {
    if (this.placeIdToDelete !== null) {
      this.DeletePlaceFromBuyBox(this.placeIdToDelete).subscribe(
        (res) => {
          // console.log('DeleteBuyBoxPlace', JSON.stringify(res.json));
          // Remove the Place from the corresponding MarketSurveyShoppingCenters
          this.BuyBoxPlacesAndShoppingCenter.forEach((center) => {
            center.MarketSurveyShoppingCenters.forEach((surveyCenter) => {
              surveyCenter.Place = surveyCenter.Place.filter(
                (p: any) => p.Id !== this.placeIdToDelete
              );
            });
          });
          modal.close('Delete click');
          this.placeIdToDelete = null;
        },
        (error) => {
          console.error('Error deleting place:', error);
          modal.dismiss('Error');
        }
      );
    }
  }
  // Delete Place Function
  DeletePlaceFromBuyBox(PlaceId: number) {
    const body: any = {
      Name: 'DeleteBuyBoxPlace',
      Params: {
        buyboxid: this.buyBoxId,
        placeid: PlaceId,
      },
    };
    return this.PlacesService.GenericAPI(body);
  }
  // Delete Shopping Center Function
  DeleteShoppingCenterFromBuyBox(ShoppingCenterId: number) {
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyboxId: this.buyBoxId,
        ShoppingCenterId: ShoppingCenterId,
      },
    };
    return this.PlacesService.GenericAPI(body);
  }
  // Toggle expansion of Shopping Center's Places
  togglePlaces(shoppingCenterId: number) {
    if (this.expandedShoppingCenters.has(shoppingCenterId)) {
      this.expandedShoppingCenters.delete(shoppingCenterId);
    } else {
      this.expandedShoppingCenters.add(shoppingCenterId);
    }
  }
  // Check if a Shopping Center's Places are expanded
  isExpanded(shoppingCenterId: number): boolean {
    return this.expandedShoppingCenters.has(shoppingCenterId);
  }
  // Open Place Street View Modal
  openPlaceStreetViewModal(
    content: TemplateRef<any>,
    streetViewURL: string
  ): void {
    if (!streetViewURL) {
      console.error('Place Street View URL is missing!');
      return;
    }
    // Set the selected place StreetViewURL
    this.selectedPlaceStreetViewURL = streetViewURL;
    // Open the modal
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
    // Wait for the modal to render before accessing the DOM
    setTimeout(() => {
      const container = document.getElementById('place-street-view-modal');
      if (!container) {
        console.error('Place Street View Container is not initialized.');
        return;
      }
      // Clear previous content and set the iframe
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = this.selectedPlaceStreetViewURL;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none'; // Optional: To remove border from iframe
      container.appendChild(iframe);
    }, 200);
  }

  openUpdateReasonModal(content: TemplateRef<any>, item: any) {
    this.selectedSiteSelectionReason =
      item.MarketSurveyShoppingCenters[0].SiteSelectionReason || '';
    this.selectedShoppingCenterId = item.MarketSurveyShoppingCenters[0].Id;
    this.modalService.open(content, { size: 'lg' });
  }

  // Update Site Selection Reason
  updateSiteSelectionReason(modal: NgbModalRef) {
    if (!this.selectedShoppingCenterId) return;

    const body = {
      Name: 'UpdateShoppingCenterSelectionReason',
      Params: {
        SiteSelectionReason: this.selectedSiteSelectionReason,
        id: this.selectedShoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe(
      (res) => {
        const shoppingCenter = this.filteredBuyBoxPlacesAndShoppingCenter.find(
          (center) => center.id === this.selectedShoppingCenterId
        );

        if (shoppingCenter) {
          // Iterate through MarketSurveyShoppingCenters to find the relevant one
          shoppingCenter.MarketSurveyShoppingCenters.forEach((surveyCenter) => {
            if (surveyCenter.Id === this.selectedShoppingCenterId) {
              // Update the SiteSelectionReason for the matched MarketSurveyShoppingCenter
              surveyCenter.SiteSelectionReason =
                this.selectedSiteSelectionReason;
            }
          });
        }

        modal.dismiss();
        this.getBuyBoxDetails();
      },
      (error) => {
        console.error('Error updating Site Selection Reason:', error);
        alert('Failed to update the reason. Please try again.');
      }
    );
  }
  // Method to open the modal and fetch nearest retails
  openNearestRetailsModal(
    content: TemplateRef<any>,
    shoppingCenter: any
  ): void {
    if (!this.buyBoxId || !shoppingCenter.id) {
      console.error('BuyBox ID or Shopping Center ID is missing!');
      return;
    }

    // Prepare API parameters
    const params = {
      buyboxid: this.buyBoxId,
      shoppingcenterid: shoppingCenter.id,
    };

    // Show spinner

    // Call the API
    this.PlacesService.GenericAPI({
      Name: 'GetShoppingCenterRelationBranches',
      Params: params,
    }).subscribe(
      (res) => {
        // Process response
        this.nearestRetails = res.json || [];
        // console.log('Nearest Retails:', this.nearestRetails);

        // Open the modal
        this.modalService.open(content, { size: 'lg' });
      },
      (error) => {
        console.error('Error fetching nearest retails:', error);
        alert('Failed to fetch nearest retails. Please try again.');
      }
    );
  }
  // m7taga Api gdida <>
  // editShoppingCenter(): void {
  //   const body = {
  //     Name: 'DataOperation',
  //     MainEntity: 'ShoppingCenter',
  //     Params: {},
  //     Json: { ...this.selectedShoppingCenter }, // Send the updated shopping center data
  //   };

  //   this.spinner.show();

  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       if (data.error) {
  //         alert('Failed to update shopping center.');
  //       } else {
  //         alert('Shopping center updated successfully.');
  //         // Update the shopping center in the table
  //         const index = this.shoppingCenterEdited.findIndex((item) => item.Id === this.selectedShoppingCenter.Id);
  //         if (index !== -1) {
  //           this.shoppingCenterEdited[index] = { ...this.selectedShoppingCenter };
  //           this.shoppingCenterEdited = [...this.shoppingCenterEdited]; // Update filtered list
  //         }
  //         this.modalService.dismissAll(); // Close the modal
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       alert('Server error occurred while updating the shopping center.');
  //       console.error('Error:', err);
  //       this.spinner.hide();
  //     },
  //   });
  // }
  // openEditShoppingCenterModal(content: TemplateRef<any>, center: any): void {
  //   this.selectedShoppingCenter = { ...center }; // Clone the center object to avoid direct mutation
  //   this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  // }
}
