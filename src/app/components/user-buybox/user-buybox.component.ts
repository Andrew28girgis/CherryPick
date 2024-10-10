import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-user-buybox',
  templateUrl: './user-buybox.component.html',
  styleUrls: ['./user-buybox.component.css']
})
export class UserBuyboxComponent {
  General!: General;
  states:any[]=[] ;
  buyboxTypes:any[]=[];
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService ,
  ) {}

  ngOnInit(): void {
    this.General = new General();
    // this.GetUserBuyBoxes();
  }

  // GetUserBuyBoxes(){
  //   this.PlacesService.GetUserBuyBoxes().subscribe((res:any)=>{
  //     this.buyboxTypes = res;
  //   })
  // }


}
