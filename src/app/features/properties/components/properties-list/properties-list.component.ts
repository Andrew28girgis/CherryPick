import { Component, OnInit, TemplateRef } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { IProperty } from '../../models/iproperty';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PropertiesService } from '../../services/properties.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrl: './properties-list.component.css',
})
export class PropertiesListComponent implements OnInit {
  protected properties: IProperty[] = [];
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
        this.propertiesService.setProperties(response.json);
      }
    });
  }
}
