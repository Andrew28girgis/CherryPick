import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import {
  Broker,
  BrokerCategories,
  General,
  GroupedProperties,
  Property,
} from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesServiceService } from 'src/app/services/properties-service.service';
import { ConfigService } from 'src/app/services/config.service';
import { Title } from '@angular/platform-browser';
import { OrganizationsService } from 'src/app/services/organizations.service';

@Component({
  selector: 'app-cherry-expansion',
  templateUrl: './cherry-expansion.component.html',
  styleUrls: ['./cherry-expansion.component.css'],
})
export class CherryExpansionComponent {
  BrokerData!: BrokerCategories[];
  Brokerorganizations: any;
  categoryId!: number;
  expansionOrganization!: any[];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private OrganizationsService: OrganizationsService,
    private spinner: NgxSpinnerService,
    private propertiesService: PropertiesServiceService,
    private configService: ConfigService,
    private titleService: Title,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.GetBrokerCategories();
    this.GetOrganizationss();
  }

  GetBrokerCategories() {
    this.PlacesService.GetBrokerCategories().subscribe((res) => {
      this.BrokerData = res.brokerCategoriesData;
    });
  }

  GetOrganizationss() {
    this.OrganizationsService.GetBrokerOrganizations().subscribe((res) => {
      this.expansionOrganization = res;
    });
  }

  chooseCategory(categoryId: number) {
    this.categoryId = categoryId;
    this.Brokerorganizations = this.BrokerData.filter(
      (b) => b.categoryId === categoryId
    )[0].organizations;

    console.log(this.Brokerorganizations);
  }
}
