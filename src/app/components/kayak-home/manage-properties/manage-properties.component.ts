import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/services/places.service';
import { Properties } from 'src/models/manage-prop';

@Component({
  selector: 'app-manage-properties',
  templateUrl: './manage-properties.component.html',
  styleUrl: './manage-properties.component.css',
})
export class ManagePropertiesComponent implements OnInit {
  properties: Properties[] = [];

  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService
  ) {}
  ngOnInit() {
    this.GetContactShoppingCenters();
  }

  GetContactShoppingCenters() {
    this.spinner.show();
    const body: any = {
      Name: 'GetContactShoppingCenters',
      MainEntity: null,
      Params: {
        ContactId: 15549,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.properties = data.json;
        console.log('Properties:', this.properties);
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching buybox info:', err);
        this.spinner.hide();
      },
    });
  }
}
