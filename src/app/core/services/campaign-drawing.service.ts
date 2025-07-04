/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IMapShape } from 'src/app/shared/models/imap-shape';
import { GenericMapService } from './generic-map.service';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class CampaignDrawingService {
  private map?: google.maps.Map;
  private drawingManager!: google.maps.drawing.DrawingManager;
  private staticModes: { [key: string]: google.maps.drawing.OverlayType } = {
    polygon: google.maps.drawing.OverlayType.POLYGON,
    circle: google.maps.drawing.OverlayType.CIRCLE,
  };
  private staticDrawingMode: string | null = null;

  private infoWindow = new google.maps.InfoWindow();

  private addedFeatures: {
    featureId: number | string;
    id: number | undefined;
    name: string;
  }[] = [];

  onFeatureAdded: EventEmitter<number | string> = new EventEmitter<
    number | string
  >();

  constructor(private genericMapService: GenericMapService) {}

  initializeMap(gmapContainer: ElementRef): google.maps.Map {
    if (this.map) this.map = undefined;
    this.map = this.genericMapService.initializeMap(gmapContainer);
    this.genericMapService.addBoundsChangeListener(this.map);
    this.genericMapService.addZoomLevelChangeListener(this.map);

    this.map.addListener('click', () => {
      this.infoWindow.close();
    });
    // this.map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
    //   if (e.latLng) {
    //     const { lat, lng } = e.latLng.toJSON();
    //     console.log(`Hovered at ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    //   }
    // });

    return this.map;
  }

  getMap(): google.maps.Map | undefined {
    return this.map;
  }

  initializeStaticDrawingManager(): void {
    if (!this.map) return;

    this.drawingManager =
      this.genericMapService.initializeStaticDrawingManager();
    this.drawingManager.setMap(this.map);
    // this.addShapeCompletionListener(map);
  }

  setStaticDrawingMode(shape: string | null) {
    this.staticDrawingMode = shape ?? null;
    this.drawingManager.setDrawingMode(shape ? this.staticModes[shape] : null);
  }

  addFeatureClickListener(): void {
    // Store the current click handler for cleanup
    let currentClickHandler: (() => void) | null = null;

    this.map?.data.addListener(
      'click',
      (event: google.maps.Data.MouseEvent) => {
        const feature: google.maps.Data.Feature = event.feature;
        const featureId = feature.getId();

        if (featureId) {
          // Close any existing info window and reset styles
          if (this.infoWindow) this.infoWindow.close();
          this.resetMapToDefaultStyle();

          const name = feature.getProperty('wof:name');

          // Highlight the clicked feature
          this.map?.data.overrideStyle(feature, {
            fillColor: '#0000FF',
            strokeColor: '#0000FF',
          });

          // Create button and content for the info window
          const button = this.getFeatureClickButton(Number(featureId));
          const windowContent = this.getFeatureClickPopupContent(
            name as string,
            button
          );

          // Set and open the info window
          this.infoWindow.setContent(windowContent);
          this.infoWindow.setPosition(event.latLng);
          this.infoWindow.open(this.map);

          // Remove existing 'closeclick' listeners to prevent duplicates
          google.maps.event.clearListeners(this.infoWindow, 'closeclick');

          google.maps.event.addListener(this.infoWindow, 'domready', () => {
            const actionBtn = document.getElementById('add-feature-action');

            if (actionBtn) {
              // Clean up any existing click handler
              if (currentClickHandler) {
                actionBtn.removeEventListener('click', currentClickHandler);
              }

              // Define the new click handler
              currentClickHandler = () => {
                const condition = this.addedFeatures.find(
                  (f) => f.featureId === Number(featureId)
                );

                if (!condition) {
                  this.addedFeatures.push({
                    featureId: featureId,
                    id: undefined,
                    name: name as string,
                  });
                  this.onFeatureAdded.emit(featureId);
                } else {
                  this.addedFeatures = this.addedFeatures.filter(
                    (f) => f.featureId !== Number(featureId)
                  );
                }

                // Update the info window content with new button state
                const updatedButton = this.getFeatureClickButton(
                  Number(featureId)
                );
                const updatedWindowContent = this.getFeatureClickPopupContent(
                  name as string,
                  updatedButton
                );

                this.infoWindow.setContent(updatedWindowContent);
                this.infoWindow.open(this.map);

                // Re-attach the click handler to the newly created button
                const newActionBtn =
                  document.getElementById('add-feature-action');
                if (newActionBtn && currentClickHandler) {
                  newActionBtn.removeEventListener(
                    'click',
                    currentClickHandler
                  );
                  newActionBtn.addEventListener('click', currentClickHandler);
                }
              };

              // Attach the click handler
              actionBtn.addEventListener('click', currentClickHandler);

              // Clean up on info window close
              google.maps.event.addListener(
                this.infoWindow,
                'closeclick',
                () => {
                  if (actionBtn && currentClickHandler) {
                    actionBtn.removeEventListener('click', currentClickHandler);
                    currentClickHandler = null;
                  }
                }
              );
            }
          });
        }
      }
    );
  }

  resetMapToDefaultStyle(): void {
    this.map?.data.forEach((f) => {
      this.map?.data.overrideStyle(f, {
        fillColor: undefined,
        strokeColor: undefined,
        strokeWeight: undefined,
      });
    });
  }

  removeAllFeatures(): void {
    this.map?.data.forEach((feature) => this.map?.data.remove(feature));
  }

  removeAllAddedFeatures(): void {
    this.addedFeatures = [];
  }

  getAllAddedFeatures(): {
    featureId: number | string;
    id: number;
    name: string;
  }[] {
    return this.addedFeatures.filter(
      (
        f
      ): f is {
        featureId: number | string;
        id: number;
        name: string;
      } => f.id !== undefined
    );
  }

  removeFeatureById(map: google.maps.Map, featureId: number | string): void {
    this.genericMapService.removeFeatureById(map, featureId);
    this.addedFeatures = this.addedFeatures.filter(
      (f) => f.featureId !== featureId
    );
  }

  updateFeatureOriginalId(
    featureId: number | string,
    originalId: number
  ): void {
    const feature = this.addedFeatures.find((f) => f.featureId === featureId);
    if (feature) feature.id = originalId;
  }

  addNewFeatureWithOriginalData(feature: {
    featureId: number | string;
    id: number;
    name: string;
  }): void {
    const existFeature = this.addedFeatures.find(
      (f) => f.featureId === feature.featureId
    );
    if (!existFeature) this.addedFeatures.push(feature);
  }

  private getFeatureClickButton(featureId: number): string {
    const condition = this.addedFeatures.find((f) => f.featureId === featureId);
    const addBtn = `<button _ngcontent-ng-c51349347="" class="btn" style="
          font-size: small;
          background-color: #4d65b4;
          border-color: #4d65b4;
          padding: 0.25rem 0.5rem;
          color: #fff;
      " id="add-feature-action">Add Neighborhood</button>`;

    const removeBtn = `<button _ngcontent-ng-c51349347="" class="btn" style="
          font-size: small;
          background-color: #ff4c4c;
          border-color: #ff4c4c;
          padding: 0.25rem 0.5rem;
          color: #fff;
      " id="add-feature-action">Remove Neighborhood</button>`;

    return condition ? removeBtn : addBtn;
  }

  private getFeatureClickPopupContent(name: string, button: string): string {
    return `<div style="padding:1rem;font-weight:400;display:flex;align-items:center;gap:1rem"><strong>${name}</strong>${button}</div>`;
  }
}
