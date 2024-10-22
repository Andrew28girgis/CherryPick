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

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent {
  General!: General;
  states: any[] = [];
  buyboxTypes: any[] = [];
  showSummery: boolean = false;
  BuyboxId!: number;
  properties!: Property[];
  groupedPropertiesArray!: GroupedProperties[];
  contactId!: any;
  token!: any;
  pageTitle!: string;
  Token: any;
  orgId!: number;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private propertiesService: PropertiesServiceService,
    private configService: ConfigService,
    private titleService: Title,
    private route: ActivatedRoute
  ) {
    this.titleService.setTitle('CherryPick');
  }

  ngOnInit(): void {
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.orgId = +params.orgId;
    });

    this.route.queryParams.subscribe((params) => {
      this.Token = params['Token'];
    });
    
    // Without Token in URL
    if (this.Token == null) {
      let token = localStorage.getItem('token');
      this.contactId = localStorage.getItem('contactId');
      +this.handleLoginResponse(token);
    }
    // With Token in URL
    else {
      this.contactId = this.route.snapshot.paramMap.get('contactId');
      localStorage.setItem('contactId', this.contactId);
      this.LoginWithContact(this.contactId, this.Token);
    }
  }

  LoginWithContact(contactId: any, token: any) {
    const x: any = { contactId, token };
    this.PlacesService.LoginWithContact(x).subscribe((res) => {
      this.handleLoginResponse(res.token);
    });
  }

  handleLoginResponse(token: any) {
    localStorage.setItem('token', token);
    if (token) {
      this.GetUserBuyBoxes();
    }
    this.groupedPropertiesArray =
      this.propertiesService.getGroupedPropertiesArray();
    if (this.groupedPropertiesArray.length > 0) {
      this.processGroupedProperties();
    }
  }

  private processGroupedProperties() {
    this.showSummery = true;
    this.BuyboxId = this.propertiesService.getbuyboxId();
    const flattenedProperties = this.groupedPropertiesArray.flatMap(
      (c) => c.properties
    );
    this.groupedPropertiesArray =
      this.groupPropertiesByCityAndState(flattenedProperties);
    this.spinner.hide();
  }

  GetUserBuyBoxes() {
     this.PlacesService.GetUserBuyBoxes().subscribe((res: any) => {
      this.buyboxTypes = res; 
      if (this.buyboxTypes.length  == 1) {
        this.chooseType(this.buyboxTypes[0].id);
      } 
    });
  }

  chooseType(buyboxId: number) {
    this.showSummery = true;
    this.showSummery = true;
    this.BuyboxId = buyboxId;
    //this.GetActionForSameBuyBox(buyboxId);
    this.GetAllWorkspacesBuyBox(buyboxId);
    this.propertiesService.setbuyboxId(this.BuyboxId);
  }

  GetAllWorkspacesBuyBox(buyboxId: number) { 
    this.spinner.show();
    this.PlacesService.BuyBoxesNumbers(buyboxId).subscribe((res: any) => {
      this.properties = res;
      this.goToAllPlaces(this.properties)  
      this.propertiesService.setGroupedPropertiesArray(this.groupedPropertiesArray);
      this.spinner.hide();
    });
  }

  groupPropertiesByCityAndState(properties: Property[]): GroupedProperties[] {
    const groupedProperties: { [key: string]: Property[] } = {};
    properties.forEach((property) => {
      const key = `${property.city?.toLowerCase()}, ${property.state}`;
      if (!groupedProperties[key]) {
        groupedProperties[key] = [];
      }
      groupedProperties[key].push(property);
    });

    const result = Object.keys(groupedProperties).map((key) => {
      const [city, state] = key.split(', ');
      return {
        city,
        state,
        properties: groupedProperties[key],
      };
    });
    return result;
  }

  getMatchStatusCount(properties: any[]): number {
    return properties.filter((property) => property.matchStatus == 1).length;
  }

  getPartialCount(properties: any[]): number {
    return properties.filter((property) => property.matchStatus == 0).length;
  }

  GetActionForSameBuyBox(buyboxId: number) {
    this.PlacesService.GetActionForSameBuyBox(buyboxId).subscribe(
      (res: any) => {
        this.General.activities = res;
      }
    );
  }

  goToPlaces(cityName: string, stateName: string, MatchStatus: number) {
    let city = this.groupedPropertiesArray;
    this.router.navigate(
      [
        '/home',
        this.contactId,
        this.BuyboxId,
        cityName,
        stateName,
        MatchStatus,
      ],
      { state: { city } }
    );
  }

  goToAllPlaces(city: any) {
    console.log(`iiii`);
    
    console.log(city);
      
    // city = this.groupedPropertiesArray;
    this.router.navigate(['/home', this.BuyboxId], {
      state: { city },
    });
  }

}
