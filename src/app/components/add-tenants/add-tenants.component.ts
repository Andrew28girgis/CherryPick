import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BuyBoxModel } from 'src/app/shared/models/BuyBoxModel';
import { Organization } from 'src/app/shared/models/buyboxShoppingCenter';
import { ApiServiceService } from 'src/app/shared/services/api-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-tenants',
  templateUrl: './add-tenants.component.html',
  styleUrls: ['./add-tenants.component.css'],
  providers: [NgbActiveModal]
})
export class AddTenantsComponent implements OnInit {
  selectedOrganizationId!: number; 
  searchOrganizationTerm: string = '';
  selectedOrganizationName!: string;  
  organizations: Organization[] = [];
  showOrganizationSuggestions: boolean = false;
  highlightedOrganizationIndex: number = -1;
  selectedManagerOrganizationId!: number;  
  organizationId!: any;
  isSearchingOrganization: boolean = false;
  buyboxTypes: any[] = [];
  editing!: boolean;
  siteDetailsForm!: FormGroup;

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private ApiService: ApiServiceService,
    private PlacesService: PlacesService,
    private fb: FormBuilder,
    public activeModal: NgbModal
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.getUserBuyBoxes();
      this.organizationId = localStorage.getItem('orgId');
    });

    this.initializerForm();
  }

  selectOrganization(organization: Organization) {
    this.siteDetailsForm.get('OrganizationId')?.setValue(organization.name);
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

  initializerForm(){
    this.siteDetailsForm = this.fb.group({
      Name: ['', Validators.required],
      OrganizationId: ['', Validators.required],
      ManagerOrganizationId: [null],
      MinBuildingSize: [null, Validators.required],
      MaxBuildingSize: [null, Validators.required],
      Restrictions: [''],
      BaseRent: [null, Validators.required],
      BuildingSquareFootage: [null, Validators.required],
      BuildingType: ['', Validators.required],
      CeilingHeight: [null],
      DealStructure: ['', Validators.required],
      DriveThru: [1, Validators.required],
      FloodZone: [''],
      FrontageLength: [null, Validators.required],
      HistoricDistrict: [''],
      LeaseTerm: [null],
      LotSize: [null, Validators.required],
      NNNCharges: [null, Validators.required],
      OvernightBoardingPermitted: [1, Validators.required],
      ParkingSpaces: [null],
      PropertyCondition: ['', Validators.required],
      PurchasePrice: [null, Validators.required],
      ServiceAccess: ['', Validators.required],
      TIAllowance: [null],
      TrafficDrection: ['', Validators.required],
      VehiclePerDay: [null, Validators.required],
      Zoning: ['', Validators.required],
      OtherComments: [''],
    });
  }

  onSubmitForm() {
    if (this.siteDetailsForm.valid) {
      this.spinner.show();
      const formData = this.siteDetailsForm.value;

      this.siteDetailsForm.value.OrganizationId = this.selectedOrganizationId;
      this.siteDetailsForm.value.ManagerOrganizationId = this.selectedManagerOrganizationId;
      
      let body: any = {
        Name: 'CreateBuyBox',
        Params: formData,
      };
      
      this.ApiService.GenericAPI(body).subscribe({
        next: (data) => {
          this.getUserBuyBoxes();
          this.activeModal.dismissAll({ created: true });
          this.spinner.hide();
          this.router.navigate(['/summary']);
          // const buyBox = data.json[0];
          // this.router.navigate(['/dashboard/', buyBox.id, buyBox.organizationId, buyBox.name]);
        },
        error: (error) => {
          console.error('API error:', error);
          this.spinner.hide();
        },
      });
    } else {
      this.siteDetailsForm.markAllAsTouched();
    }
  }
}
