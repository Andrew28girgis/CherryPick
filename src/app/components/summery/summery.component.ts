import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/shared/services/places.service';
import { General } from 'src/app/shared/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesServiceService } from 'src/app/shared/services/properties-service.service';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center, Place } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { StateService } from 'src/app/shared/services/state.service';
import { SidbarService } from 'src/app/shared/services/sidbar.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyBoxModel } from 'src/app/shared/models/BuyBoxModel';
import { ApiServiceService } from 'src/app/shared/services/api-service.service';
import { Organization } from 'src/app/shared/models/buyboxShoppingCenter';

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent {
  General!: General;
  buyboxTypes: any[] = [];
  showSummery: boolean = false;
  Token: any;
  orgId!: number;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  standAlone: Place[] = [];
  buyboxPlaces: BbPlace[] = [];
  isCollapsed = true;
  organizationId!: any;
  editing!: boolean;
  Obj!: BuyBoxModel;
  searchManagerOrganizationTerm: string = '';
  highlightedOrganizationIndex: number = -1;
  highlightedManagerOrganizationIndex: number = -1;
  showOrganizationSuggestions: boolean = false;
  showManagerOrganizationSuggestions: boolean = false;
  isSearchingOrganization: boolean = false;
  isSearchingManagerOrganization: boolean = false;
  managerOrganizations: { id: number; name: string }[] = [];
  selectedManagerOrganizationId!: number; // Bound to the manager dropdown
  buyBoxes: any[] = [];
  organizations: Organization[] = [];
  selectedOrganizationId!: number; // To bind the selected organization
  searchOrganizationTerm: string = '';
  selectedOrganizationName!: string; // Holds the selected organization name

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private propertiesService: PropertiesServiceService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private sidbarService: SidbarService,
    private modalService: NgbModal,
    private ApiService: ApiServiceService
  ) {
    this.sidbarService.isCollapsed.subscribe(
      (state: boolean) => (this.isCollapsed = state)
    );
  }

  ngOnInit(): void {
    this.stateService.clearAll();
    this.General = new General();
    this.route.queryParams.subscribe((params) => {
      this.Token = params['Token'];
      this.getUserBuyBoxes();
      this.organizationId = localStorage.getItem('orgId');
    });
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state;
    });
  }

  getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json != null) {
          this.buyboxTypes = data.json;
          this.spinner.hide();
        } else {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  GetUserBuyBoxes() {
    this.PlacesService.GetUserBuyBoxes().subscribe((res: any) => {
      this.buyboxTypes = res;
      if (this.buyboxTypes.length == 1) {
        this.chooseType(
          this.buyboxTypes[0].id,
          this.buyboxTypes[0].organizationId,
          this.buyboxTypes[0].name
        );
      }
    });
  }

  chooseType(buyboxId: number, orgId: number, name: string) {
    this.showSummery = true;
    this.showSummery = true;
    this.goToAllPlaces(buyboxId, orgId, name);
    this.propertiesService.setbuyboxId(buyboxId);
  }

  goToAllPlaces(buyboxId: number, orgId: number, name: string) {
    this.router.navigate(['/home', buyboxId, orgId, name]);
  }
  open(content: any) {
    this.editing = false;
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      scrollable: true,
      size:'xl'
    });
    this.Obj = new BuyBoxModel();
  }
  closeModal() {
    this.editing = false;
    this.modalService.dismissAll();
    this.Obj = new BuyBoxModel(); // Reset the 'Obj' to its default state
  }

  selectOrganization(organization: Organization) {
    this.selectedOrganizationId = organization.id; // Store the selected organization ID
    this.selectedOrganizationName = organization.name; // Store the selected organization's name
    this.searchOrganizationTerm = organization.name; // Keep the selected name in the input field
    this.organizations = []; // Clear suggestions
    this.showOrganizationSuggestions = false;
    this.highlightedOrganizationIndex = -1;
  }
  handleOrganizationBlur() {
    setTimeout(() => {
      this.showOrganizationSuggestions = false;
      this.highlightedOrganizationIndex = -1;
    }, 100);
  }
  onOrganizationInput(event: any) {
    const val: string = event.target.value;
    this.searchOrganizationTerm = val;

    if (val.length > 2) {
      this.searchOrganization(val);
    } else {
      this.organizations = [];
      this.showOrganizationSuggestions = false;
      this.highlightedOrganizationIndex = -1;
    }
  }
  handleOrganizationKeydown(event: KeyboardEvent) {
    if (this.showOrganizationSuggestions && this.organizations.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedOrganizationIndex =
          (this.highlightedOrganizationIndex + 1) % this.organizations.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedOrganizationIndex =
          (this.highlightedOrganizationIndex - 1 + this.organizations.length) %
          this.organizations.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (
          this.highlightedOrganizationIndex >= 0 &&
          this.highlightedOrganizationIndex < this.organizations.length
        ) {
          this.selectOrganization(
            this.organizations[this.highlightedOrganizationIndex]
          );
          event.preventDefault();
        }
      }
    }
  }
  onSubmit() {
    this.spinner.show();
    this.Obj.OrganizationId = this.selectedOrganizationId; // Set the selected organization ID
    this.Obj.ManagerOrganizationId = this.selectedManagerOrganizationId; // Set the selected manager organization ID

    this.spinner.show();
    let body: any = {
      Name: 'CreateBuyBox',
      Params: {
        Name: this.Obj.Name,
        OrganizationId: this.Obj.OrganizationId,
        ManagerOrganizationId: this.Obj.ManagerOrganizationId,
        MinBuildingSize: this.Obj.MinBuildingSize,
        MaxBuildingSize: this.Obj.MaxBuildingSize,
      },
    };
    this.ApiService.GenericAPI(body).subscribe({
      next: (data) => {
        this.getUserBuyBoxes();
        this.closeModal();
        this.spinner.hide();
      },
    });
  }
  searchOrganization(term: string) {
    this.isSearchingOrganization = true;
    let body: any = {
      Name: 'SearchOrganizationByName',
      Params: {
        Name: term,
      },
    };
    this.ApiService.GenericAPI(body).subscribe(
      (res: any) => {
        this.organizations = res.json as Organization[];
        this.showOrganizationSuggestions = true;
        this.highlightedOrganizationIndex = -1;
        this.isSearchingOrganization = false;
      }
    );
  }
}
