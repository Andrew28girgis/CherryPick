import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Organization } from 'src/app/shared/models/buyboxShoppingCenter';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlacesService } from 'src/app/core/services/places.service';
import { ApiServiceService } from 'src/app/core/services/api-service.service';

@Component({
  selector: 'app-add-tenants',
  templateUrl: './add-tenants.component.html',
  styleUrls: ['./add-tenants.component.css'],
  providers: [NgbActiveModal],
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
  Options: any[] = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
  ];
  FloodZoneOptions: any[] = [
    { label: 'Zone X', value: 'Zone X' },
    { label: 'Zone AE', value: 'Zone AE' },
  ];
  currentStep = 1;
  totalSteps = 3;

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
          this.spinner.hide();
        } else {
          // this.router.navigate(['/login']);
        }
      },
    });
  }

  initializerForm() {
    this.siteDetailsForm = this.fb.group({
      Name: ['', Validators.required],
      OrganizationId: ['', Validators.required],
      ManagerOrganizationId: [''],
      MinBuildingSize: [null, Validators.required],
      MaxBuildingSize: [null, Validators.required],
      Restrictions: [''],
      BaseRent: [''],
      BuildingSquareFootage: [''],
      BuildingType: [''],
      CeilingHeight: [''],
      DealStructure: [''],
      DriveThru: [0],
      FloodZone: [''],
      FrontageLength: [''],
      HistoricDistrict: [''],
      LeaseTerm: [''],
      LotSize: [''],
      NNNCharges: [''],
      OvernightBoardingPermitted: [0],
      ParkingSpaces: [''],
      PropertyCondition: [''],
      PurchasePrice: [''],
      ServiceAccess: [''],
      TIAllowance: [''],
      TrafficDrection: [''],
      VehiclePerDay: [''],
      Zoning: [''],
      OtherComments: [''],
    });
  }

  onSubmitForm(nextCallback?: any) {
    if (this.siteDetailsForm.valid) {
      this.spinner.show();
      const formData = this.siteDetailsForm.value;

      this.siteDetailsForm.value.OrganizationId = this.selectedOrganizationId;
      this.siteDetailsForm.value.ManagerOrganizationId =
        this.selectedManagerOrganizationId;

      let body: any = {
        Name: 'CreateBuyBox',
        Params: formData,
      };

      this.ApiService.GenericAPI(body).subscribe({
        next: (data) => {
          if (data.json && data.json.length > 0 && data.json[0].id) {
            localStorage.setItem('BuyBoxId', data.json[0].id);
          }

          this.getUserBuyBoxes();
          this.spinner.hide();
          nextCallback.emit();
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

  validateAndProceed(nextCallback: any, StepNum: number) {
    if (StepNum == 1) {
      const controlsToCheck = [
        'Name',
        'OrganizationId',
        'MinBuildingSize',
        'MaxBuildingSize',
      ];

      if (controlsToCheck.every(
          (control) => this.siteDetailsForm.get(control)?.valid
        )) {
        this.nextStep();
        nextCallback.emit();
      } else {
        controlsToCheck.forEach((control) =>
          this.siteDetailsForm.get(control)?.markAllAsTouched()
        );
      }
    } else if (StepNum == 2) {
      this.nextStep();
      nextCallback.emit();
    } else {
      this.siteDetailsForm.markAllAsTouched();
    }
  }

  CreatePolygons() {
    this.spinner.show();
    this.getUserBuyBoxes();
    this.activeModal.dismissAll({ created: true });
    this.spinner.hide();
    this.router.navigate(['/summary']);
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
}
