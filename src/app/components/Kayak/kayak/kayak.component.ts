import { filterValues } from './../../../../models/filters';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { KayakResult, StatesAndCities } from 'src/models/kayak';
import { KayakFilters } from 'src/models/filters';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-kayak',
  templateUrl: './kayak.component.html',
  styleUrls: ['./kayak.component.css'],
})
export class KayakComponent implements OnInit {
  Ids!: number[];
  filtered!: any;
  KayakResult!: KayakResult;
  KayakCitiesandStates: StatesAndCities[] = [];
  selectedState: any;
  selectedCity: any;
  uniqueStates!: any[];
  uniqueCities!: any[];
  Filters!: KayakFilters;
  filterValues!: any;

  tags: any[] = [];
  visibleTags: any[] = [];
  selectedTags: any[] = [];
  searchTerm: string = '';
  formSearch: boolean = false;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.GetStatesAndCities();
    this.GetFilters();
    this.filterValues = {};
  }

  getResult(): void {
    console.log(this.filterValues);

    const body: any = {
      Name: 'GetResult',
      Params: this.filterValues,
    };
    
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.KayakResult = data.json[0];
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  GetFilters(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetFilters',
      Params: {
        ids: this.Ids,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.Filters = data.json[0];
        console.log(`filters`);

        console.log(this.Filters);

        this.spinner.hide();
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
        this.uniqueStates = [
          ...new Set(
            this.KayakCitiesandStates.map((item: any) => item.stateCode.trim())
          ),
        ];
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getCitiesOfState() {
    this.selectedCity = '';
    this.uniqueCities = this.KayakCitiesandStates.filter(
      (s) => s.stateCode == this.filterValues?.statecode
    );
    console.log(this.KayakCitiesandStates);
  }

  searchShoppingCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'GetResult',
      Params: {
        city: this.selectedCity ? this.selectedCity : '',
        statecode: this.selectedState ? this.selectedState : '',
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
        this.GetFilters();
        this.spinner.hide();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  openTagsModal(content: TemplateRef<any>): void {
    this.modalService.open(content, { size: 'lg' });
    this.showDefaultTags();
    this.GetTags();
  }
  showDefaultTags(): void {
    this.visibleTags = this.tags.slice(0, 10); // Show the first 10 tags by default
  }
  GetTags(): void {
    const body: any = {
      Name: 'GetTags',
      MainEntity: null,
      Params: {},
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.tags = data.json;
        this.visibleTags = this.tags.slice(0, 10); // Show first 10 tags by default
      },
      error: (err) => {
        console.error('Error fetching tags:', err);
      },
    });
  }
  filterTags(): void {
    if (this.searchTerm) {
      this.visibleTags = this.tags.filter((tag) =>
        tag.tag.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.visibleTags = this.tags.slice(0, 10); // Reset to default
    }
  }
  toggleTagSelection(tag: any): void {
    const index = this.selectedTags.findIndex((t) => t.tag === tag.tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1); // Remove if already selected
    } else {
      this.selectedTags.push(tag); // Add if not selected
    }
    // Update isSelected property to sync with modal
    const modalTagIndex = this.tags.findIndex((t) => t.tag === tag.tag);
    if (modalTagIndex > -1) {
      this.tags[modalTagIndex].isSelected = index === -1;
    }
    // this.GetWizardShoppingCenters();
  }
  isTagSelected(tag: any): boolean {
    return this.selectedTags.some((t) => t.tag === tag.tag);
  }
  removeTag(tag: any): void {
    // Remove the tag from the selectedTags array
    this.selectedTags = this.selectedTags.filter((t) => t.tag !== tag.tag);
    // Update the modal's checkbox state
    const modalTagIndex = this.tags.findIndex((t) => t.tag === tag.tag);
    if (modalTagIndex > -1) {
      this.tags[modalTagIndex].isSelected = false; // Ensure sync with modal
    }
  }
  applyTags(): void {
    const selectedTagsJson = this.selectedTags.map((tag) => ({ tag: tag.tag }));
    console.log('Selected Tags to be sent:', selectedTagsJson);
    this.modalService.dismissAll();
  }
}
