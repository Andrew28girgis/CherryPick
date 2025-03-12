import { Component, TemplateRef } from '@angular/core';
import { StateCity } from 'src/app/shared/models/buyboxShoppingCenter';
import { PlacesService } from 'src/app/shared/services/places.service';
import { ActivatedRoute } from '@angular/router';

export interface ApiParam {
  id?: number;
  Query?: string;
  Name?: string;
  Duration?: any;
  CreatedDate?: any;
  Authentication?: any;
  categoryId?: number;
  whereCondition?: string;
  TopStatement?: string;
}

export interface ApiBody {
  Name: string;
  Params: ApiParam;
  MainEntity: string;
  Json: any;
}

@Component({
  selector: 'app-work-spaces',
  templateUrl: './work-spaces.component.html',
  styleUrls: ['./work-spaces.component.css'],
})
export class WorkSpacesComponent {
  UsaStateCities: StateCity[] = [];
  uniqueStates: string[] = [];
  filteredCities: string[] = [];
  isLoadingStatesAndCities: boolean = false;
  buyBoxId!: number | null;
  WorkSpace: any = { state: '', city: '' };
  BuyBoxWorkSpaces: any;

  constructor(
    private PlacesService: PlacesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route?.paramMap.subscribe((params: any) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });
    this.GetBuyBoxWorkSpaces(this.buyBoxId as number);
    this.GetStatesAndCities();
  }

  GetStatesAndCities() {
    this.isLoadingStatesAndCities = true;

    let body: any = {
      Name: 'GetStatesAndCities',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.UsaStateCities = (data.json as StateCity[]) || null;
        const stateCodes = Array.from(
          new Set(
            this.UsaStateCities.map((stateCity) => stateCity.stateCode).filter(
              (code) => !!code
            )
          )
        ).sort();

        this.uniqueStates = stateCodes;

        this.isLoadingStatesAndCities = false;
      },
      error: (error) => {
        console.error('Error fetching States and Cities:', error);
        this.isLoadingStatesAndCities = false;
        alert('Failed to load States and Cities. Please try again.');
      },
      complete: () => {
        this.isLoadingStatesAndCities = false;
      },
    });
  }
  onStateChange() {
    this.WorkSpace.city = '';
    const selectedState = this.WorkSpace.state;

    if (selectedState) {
      this.filteredCities = this.UsaStateCities.filter(
        (stateCity) => stateCity.stateCode === selectedState
      )
        .map((stateCity) => stateCity.city)
        .sort();
    } else {
      this.filteredCities = [];
    }
  }

  GetBuyBoxWorkSpaces(id: number) {
    let body: any = {
      Name: 'GetBuyBoxWorkSpaces',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.error != null && data.error != undefined) {
          alert('Failed To Fetch WorkSpaces');
        } else {
          this.BuyBoxWorkSpaces = data.json;
          if (!this.WorkSpace) {
            this.WorkSpace = { state: '', city: '' };
          }
        }
      },
      error: (error) => {
        alert('Server Error');
        console.error('Error fetching APIs:', error);
      },
    });
  }

  validateAndAddWorkSpace() {
    const payload = {
      buyboxId: this.buyBoxId,
      state: this.WorkSpace.state,
      city: this.WorkSpace.city,
    };

    let body: any = {
      Name: 'InsertWorkSpace',
      Params: payload,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.error != null && data.error != undefined) {
          alert('Failed to Add Workspace');
        } else {
          this.BuyBoxWorkSpaces.push(data.json);
          this.WorkSpace.state = null;
          this.WorkSpace.city = null;
        }
        this.GetBuyBoxWorkSpaces(this.buyBoxId as number);
      },
      error: (error) => {
        alert('Server Error');
        console.error('Error adding Workspace:', error);
      },
    });
  }
  deleteWorkspace(id: number) {
    const body: ApiBody = {
      Name: 'DeleteFromTable',
      MainEntity: '',
      Params: { id: id, Name: 'workspace' },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.error != null && data.error != undefined) {
          alert('Failed To Delete Data');
        } else {
          const Index = this.BuyBoxWorkSpaces.findIndex(
            (item: any) => item.id == id
          );
          this.BuyBoxWorkSpaces.splice(Index, 1);
        }
      },
      error: (error) => {
        alert('Server Error');
        console.error('Error fetching APIs:', error);
      },
      complete: () => {},
    });
  }
}
