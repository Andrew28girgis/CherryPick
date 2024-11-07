import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General, GroupedProperties, Property } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesServiceService } from 'src/app/services/properties-service.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';

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

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private propertiesService: PropertiesServiceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.orgId = +params.orgId;
    });

    this.route.queryParams.subscribe((params) => {
      this.Token = params['Token'];
    });

    this.GetUserBuyBoxes();
  }

  GetUserBuyBoxes() {
    this.PlacesService.GetUserBuyBoxes().subscribe((res: any) => {
      this.buyboxTypes = res;
      if (this.buyboxTypes.length == 1) {
        this.chooseType(this.buyboxTypes[0].id);
      }
    });
  }

  chooseType(buyboxId: number) {
    this.showSummery = true;
    this.showSummery = true;
    this.goToAllPlaces(buyboxId);
    this.propertiesService.setbuyboxId(buyboxId);
  }

  goToAllPlaces(buyboxId: number) {
    this.router.navigate(['/home', buyboxId]);
  }
  
}
