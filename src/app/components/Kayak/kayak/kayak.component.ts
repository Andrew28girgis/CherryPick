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
  KayakResult!: KayakResult; // Stores the filtered results
  KayakCitiesandStates: StatesAndCities[] = []; // Stores the states and cities data

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.getResult('', ''); // Load all results by default
    this.GetStatesAndCities();

    // Add event listener for the search button
    const searchButton = document.querySelector('.blue-box') as HTMLDivElement;
    searchButton.addEventListener('click', () => {
      const stateSelect = document.querySelector('#state-select') as HTMLSelectElement;
      const citySelect = document.querySelector('#city-select') as HTMLSelectElement;

      const selectedState = stateSelect.value === 'State' ? '' : stateSelect.value;
      const selectedCity = citySelect.value === 'City' ? '' : citySelect.value;

      // Call getResult with selected values
      this.getResult(selectedState, selectedCity);
    });
  }

  /**
   * Fetches results based on the selected state and city.
   */
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
        this.KayakResult = data.json[0]; // Update the result with filtered data
        console.log(this.KayakResult);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  /**
   * Fetches the states and cities and populates the dropdowns.
   */
  GetStatesAndCities(): void {
    const body: any = {
      Name: 'GetStatesAndCities',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakCitiesandStates = data.json;

        // Extract unique states using a Set
        const uniqueStates = Array.from(
          new Set(this.KayakCitiesandStates.map((item: any) => item.stateCode))
        );

        // Populate the state dropdown
        const stateSelect = document.querySelector('#state-select') as HTMLSelectElement;
        stateSelect.innerHTML = '<option selected>State</option>';
        uniqueStates.forEach((state) => {
          const option = document.createElement('option');
          option.value = state;
          option.textContent = state;
          stateSelect.appendChild(option);
        });

        // Attach event listener to populate city dropdown on state selection
        stateSelect.addEventListener('change', () => {
          const selectedState = stateSelect.value;
          const citySelect = document.querySelector('#city-select') as HTMLSelectElement;

          // Filter cities based on selected state
          const filteredCities = this.KayakCitiesandStates.filter(
            (item: any) => item.stateCode === selectedState
          );

          // Populate city dropdown
          citySelect.innerHTML = '<option selected>City</option>';
          filteredCities.forEach((city) => {
            const option = document.createElement('option');
            option.value = city.city;
            option.textContent = city.city;
            citySelect.appendChild(option);
          });
        });
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }
}
