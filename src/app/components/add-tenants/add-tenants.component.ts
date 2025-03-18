import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BuyBoxModel } from 'src/app/shared/models/BuyBoxModel';
import { Organization } from 'src/app/shared/models/buyboxShoppingCenter';
import { ApiServiceService } from 'src/app/shared/services/api-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-tenants',
  templateUrl: './add-tenants.component.html',
  styleUrls: ['./add-tenants.component.css'],
})
export class AddTenantsComponent implements OnInit {
  Obj = {
    Id: 0,
    Name: '',
    Description: '',
    FPOId: 0,
    ComparableTypeId: 0,
    MinBuildingSize: 0,
    MaxBuildingSize: 0,
    MinLandSize: 0,
    MaxLandSize: 0,
    AcquisitionTypeId: 0,
    EmptyLand: 0,
    MinBuildingUnits: 0,
    MaxBuildingUnits: 0,
    OrganizationId: 0,
    ManagerOrganizationId: 0,
    kanbanId: 0,
    ManagerContactId: 0,
    OrgName: '',
  };
  selectedOrganizationId!: number; // To bind the selected organization
  searchOrganizationTerm: string = '';
  selectedOrganizationName!: string; // Holds the selected organization name
  organizations: Organization[] = [];
  showOrganizationSuggestions: boolean = false;
  highlightedOrganizationIndex: number = -1;
  selectedManagerOrganizationId!: number; // Bound to the manager dropdown
  organizationId!: any;
  isSearchingOrganization: boolean = false;
  buyboxTypes: any[] = [];
  editing!: boolean;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private ApiService: ApiServiceService,
    private PlacesService: PlacesService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      // this.Token = params['Token'];
      this.getUserBuyBoxes();
      this.organizationId = localStorage.getItem('orgId');
    });
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
    this.activeModal.dismiss();
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
        // this.closeModal();
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
    this.ApiService.GenericAPI(body).subscribe((res: any) => {
      this.organizations = res.json as Organization[];
      this.showOrganizationSuggestions = true;
      this.highlightedOrganizationIndex = -1;
      this.isSearchingOrganization = false;
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
          console.log('buyboxTypes', this.buyboxTypes);

          this.spinner.hide();
        } else {
          // this.router.navigate(['/login']);
        }
      },
    });
  }
}
