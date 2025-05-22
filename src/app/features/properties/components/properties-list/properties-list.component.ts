import { Component, OnInit, TemplateRef } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { IProperty } from '../../models/iproperty';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesService } from '../../services/properties.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IPageEvent } from '../../models/ipage-event';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrl: './properties-list.component.css',
})
export class PropertiesListComponent implements OnInit {
  protected first: number = 0;
  protected rows: number = 10;
  protected properties: IProperty[] = [];
  protected paginatedProperties: IProperty[] = [];
  protected dataLoaded: boolean = false;

  constructor(
    private placeService: PlacesService,
    private breadcrumbService: BreadcrumbService,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.clearBreadcrumbs();
    this.getAllProperties();
  }

  protected getAllProperties(): void {
    const properties = this.propertiesService.getProperties();
    if (properties.length) {
      this.properties = [...properties];
      this.paginatedProperties = this.properties.slice(
        this.first,
        this.first + this.rows
      );
      this.dataLoaded = true;
      return;
    }

    const body = {
      Name: 'GetAllShoppingCenters',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      this.dataLoaded = true;
      if (response.json && response.json.length) {
        this.properties = response.json;
        this.paginatedProperties = this.properties.slice(
          this.first,
          this.first + this.rows
        );
        this.propertiesService.setProperties(response.json);
      }
    });
  }

  onPageChange(event: IPageEvent) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;

    this.paginatedProperties = this.properties.slice(
      this.first,
      this.first + this.rows
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
