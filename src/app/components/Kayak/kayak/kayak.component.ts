import {
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KayakResult, StatesAndCities } from 'src/models/kayak';

@Component({
  selector: 'app-kayak',
  templateUrl: './kayak.component.html',
  styleUrls: ['./kayak.component.css'],
})
export class KayakComponent implements OnInit {
  Ids!: number[]; 
  filtered!:any;
  KayakResult!: KayakResult; // Stores the filtered results
  KayakCitiesandStates: StatesAndCities[] = []; // Stores the states and cities data
  selectedState:any;
  selectedCity:any;
  uniqueStates!:any[];
  uniqueCities!:any[];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.GetStatesAndCities();
    this.GetFilters();
  }

  getResult(stateCode: string, city: string): void {
    const body: any = {
      Name: 'GetResult',
      Params: {
        city: city || '',
        statecode: stateCode || '',
        minsize: '',
        maxsize: '',
        tags: '',
        secondarytype: '',
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakResult = data.json[0];  
  
        
       },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }
  GetFilters(): void {
    const body: any = {
      Name: 'GetFilters',
      Params: {
        ids : this.Ids 
      },

    }; 
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.filtered = data;  
        console.log(this.filtered);
        
       },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }
  

 
  GetStatesAndCities(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetStates',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakCitiesandStates = data.json; 
        console.log(this.KayakCitiesandStates);
        

        this.uniqueStates = Array.from(
          new Set(this.KayakCitiesandStates.map((item: any) => item.stateCode))
        );   
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }


  getCitiesOfState(){
    this.uniqueCities = this.KayakCitiesandStates.filter(s=> s.stateCode == this.selectedState);    
  } 

  searchShoppingCenter(){
    this.spinner.show();
    const body: any = {
      Name: 'GetResult',
      Params: {
        city: this.selectedCity ? this.selectedCity : '',
        statecode: this.selectedState ? this.selectedState : '' ,
        minsize: '',
        maxsize: '',
        tags: '',
        secondarytype: '',
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakResult = data.json[0];  
        this.Ids = data.json[0].Ids;
        console.log(this.Ids);
        
        this.GetFilters(); 
        this.spinner.hide();
       },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }
}
