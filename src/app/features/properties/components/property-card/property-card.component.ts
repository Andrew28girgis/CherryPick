import { Component, Input, TemplateRef } from '@angular/core';
import { IProperty } from '../../models/iproperty';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare const google: any;

@Component({
  selector: 'app-property-card',
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css',
})
export class PropertyCardComponent {
  protected sanitizedPropertyStreetViewUrl?: SafeResourceUrl;

  @Input() property!: IProperty;

  constructor(
    private modalService: NgbModal,
    private sanitizer: DomSanitizer
  ) {}

  protected openPropertyStreetViewModal(
    content: TemplateRef<any>,
    property: IProperty
  ): void {
    const modal = this.modalService.open(content, {
      size: 'lg',
      scrollable: true,
    });

    this.sanitizedPropertyStreetViewUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(property.StreetViewURL!);
  }

  protected async openPropertyLocationModal(
    content: TemplateRef<any>,
    property: IProperty
  ): Promise<void> {
    const modal = this.modalService.open(content, {
      size: 'lg',
      scrollable: true,
    });

    this.initializePropertyLocationView(property);
  }

  initializePropertyLocationView(property: IProperty): void {
    try {
      const mapDiv = document.getElementById('mapLocationView') as HTMLElement;

      if (!mapDiv) {
        return;
      }

      const mapOptions: google.maps.MapOptions = {
        center: { lat: property.Latitude!, lng: property.Longitude! },
        zoom: 8,
        disableDefaultUI: true,
      };

      const map: google.maps.Map = new google.maps.Map(mapDiv, mapOptions);

      let marker = new google.maps.Marker({
        map,
        position: {
          lat: property.Latitude!,
          lng: property.Longitude!,
        },
        zIndex: 999999,
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      return;
    }
  }
}
