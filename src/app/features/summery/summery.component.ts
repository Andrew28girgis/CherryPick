import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center, Place } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyBoxModel } from 'src/app/shared/models/BuyBoxModel';
import { Organization } from 'src/app/shared/models/buyboxShoppingCenter';
import { PlacesService } from 'src/app/core/services/places.service';
import { StateService } from 'src/app/core/services/state.service';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})

export class SummeryComponent implements OnInit {
  General!: General;
  tenants: any[] = [];
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
  @ViewChild('BuyBoxProperty') buyBoxProperty!: TemplateRef<any>;
  modalOpened: boolean = false;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private modalService: NgbModal,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'My Tenants', url: '/summary' },
    ]);
    this.stateService.clearAll();
    this.General = new General();
    this.route.queryParams.subscribe((params) => {
      this.Token = params['Token'];
      this.getUserBuyBoxes();
      this.organizationId = localStorage.getItem('orgId');
    });
    this.modalOpened = false;
  }

  getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.tenants = data.json;
        if (this.tenants.length === 0 && !this.modalOpened) {
          this.modalOpened = true;
          this.openAddTenant(this.buyBoxProperty);
        }

        this.spinner.hide();
      },
    });
  }

  openAddTenant(content: any) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      scrollable: true,
      size: 'xl',
    });
    this.Obj = new BuyBoxModel();

    modalRef.result
      .then((result) => {
        if (result && result.created) {
          this.getUserBuyBoxes();
          this.modalService.dismissAll();
        }
      })
      .catch((error) => {
        this.getUserBuyBoxes();
      });
  }
}
