import { Component, ViewChildren, QueryList, AfterViewInit, ElementRef, HostListener, ViewChild, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General, GroupedProperties, Property } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesServiceService } from 'src/app/services/properties-service.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { StateService } from 'src/app/services/state.service';
import { SidebarService } from '../kanban/sidebar/sidebar.service';
import { SidbarService } from 'src/app/services/sidbar.service';

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent  {
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

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private propertiesService: PropertiesServiceService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private sidbarService: SidbarService,
    private renderer: Renderer2
  ) {
    this.sidbarService.isCollapsed.subscribe(
      (state: boolean) => (this.isCollapsed = state)
    );    
  }

  ngOnInit(): void {
    this.stateService.clearAll();
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.orgId = +params.orgId;
    });

    this.route.queryParams.subscribe((params) => {
      this.Token = params['Token'];
      this.getUserBuyBoxes();
    });

    //this.GetUserBuyBoxes();
  }


  getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {
      }, 
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if(data.json!=null){
          this.buyboxTypes =  data.json ;
          if (this.buyboxTypes?.length == 1) {
            this.chooseType(this.buyboxTypes[0].id ,this.buyboxTypes[0].organizationId , this.buyboxTypes[0].name);
          }
          this.spinner.hide();
        } else{
          this.router.navigate(['/login']);
        } 
      } 
    });
  }

  GetUserBuyBoxes() {
    this.PlacesService.GetUserBuyBoxes().subscribe((res: any) => {
      this.buyboxTypes = res;
      if (this.buyboxTypes.length == 1) {
        this.chooseType(this.buyboxTypes[0].id ,  this.buyboxTypes[0].organizationId , this.buyboxTypes[0].name);
      }
    });
  }

  chooseType(buyboxId: number , orgId:number , name:string) {
    this.showSummery = true;
    this.showSummery = true;
    this.goToAllPlaces(buyboxId , orgId , name);
    this.propertiesService.setbuyboxId(buyboxId);
  }

  goToAllPlaces(buyboxId: number , orgId:number , name:string) {
    this.router.navigate(['/home', buyboxId , orgId , name]);
  }

}
