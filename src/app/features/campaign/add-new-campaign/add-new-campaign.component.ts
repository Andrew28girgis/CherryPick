import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil } from 'rxjs';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { GenericMapService } from 'src/app/core/services/generic-map.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
import { IMapState } from 'src/app/shared/interfaces/imap-state';
import { Tenant } from 'src/app/shared/models/tenant';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-new-campaign',
  templateUrl: './add-new-campaign.component.html',
  styleUrl: './add-new-campaign.component.css',
})
export class AddNewCampaignComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();
  private contactId!: number;
  private addedStates: Map<string, string> = new Map<string, string>();
  private addedCities: Map<string, string[]> = new Map<string, string[]>();
  private displayedGeoJsons: {
    featureId: number | string;
    id: number;
    name: string;
  }[] = [];
  private mapBounds: IMapBounds | null = null;
  private campaignMinSize!: number;
  private campaignMaxSize!: number;

  protected organizationId!: number;
  // protected buyBoxId!: number;
  protected selectedDrawingModeId: number = 1;
  protected visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  protected isPrivateCampaign: number = 1;
  protected campaignName: string = '';
  protected loadingGlobalPolygons: boolean = false;
  protected mapStates: IMapState[] = [];
  protected selectedStateTab: string = '';
  protected mainFloatingCardCollapsed: boolean = false;
  protected campaignContentCollapsed: boolean = false;
  protected addedListTabs: string[] = ['States', 'Cities', 'Neighborhoods'];
  protected selectedAddedListTab: string = '';
  protected realTimeGeoJsons: { id: number; name: string }[] = [];
  protected displayMode: number = 1;
  protected lastDisplayMode: number = 1;
  protected selectedCityName: string = '';
  protected allOrganizations!: Tenant[];
  protected showSelectMenu: boolean = false;

  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private genericMapService: GenericMapService,
    private campaignDrawingService: CampaignDrawingService,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private httpClient: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    private breadcrumbService: BreadcrumbService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Campaigns', url: '/summary' },
      { label: 'Add Campaign', url: '/add-campaign' },
    ]);
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    this.activatedRoute.paramMap.subscribe((parms) => {
      const organizationId = parms.get('organizationId');
      if (organizationId) this.organizationId = +organizationId;
    });

    this.activatedRoute.queryParamMap.subscribe((parms) => {
      const minSize = parms.get('minSize');
      const maxSize = parms.get('maxSize');

      if (minSize) this.campaignMinSize = +minSize;
      if (maxSize) this.campaignMaxSize = +maxSize;
    });

    // const bbId = localStorage.getItem('BuyBoxId');
    // if (bbId) this.buyBoxId = +bbId;

    this.mapBoundsChangeListeners();
    this.featureAddedListeners();
    this.getAllOrganizations();
  }

  ngAfterViewInit(): void {
    if (!this.organizationId) {
      this.showSelectMenu = true;
    }
    this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeStaticDrawingManager();
    const map = this.campaignDrawingService.getMap();
    if (map) this.genericMapService.updateMapZoomLevel(map, 13);
    this.campaignDrawingService.addFeatureClickListener();
  }

  private featureAddedListeners(): void {
    this.campaignDrawingService.onFeatureAdded
      .pipe(takeUntil(this.destroy$))
      .subscribe((featureId: number | string) => {
        const feature = this.displayedGeoJsons.find(
          (f) => f.featureId == featureId
        );
        if (feature) {
          this.campaignDrawingService.updateFeatureOriginalId(
            featureId,
            feature.id
          );
        }
      });
  }

  private mapBoundsChangeListeners(): void {
    this.genericMapService.onMapBoundsChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((bounds: IMapBounds) => {
        this.mapBounds = bounds;
        this.cdr.detectChanges();

        this.getStatesInsideMapView();
      });
  }

  private getStatesInsideMapView(): void {
    const body: any = {
      Name: 'GetStatesInsideBoundingBox',
      Params: {
        minLat: this.mapBounds?.southWestLat,
        minLng: this.mapBounds?.southWestLng,
        maxLat: this.mapBounds?.northEastLat,
        maxLng: this.mapBounds?.northEastLng,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        const existingStateCodes = new Set(
          this.mapStates?.map((s: IMapState) => s.code) || []
        );
        const newStates: IMapState[] = response.json
          .filter(
            (s: { stateId: string }) => !existingStateCodes.has(s.stateId)
          )
          .map((s: { stateId: string }) => ({ code: s.stateId }));

        const combinedStates = [...this.mapStates, ...newStates];

        this.mapStates = response.json
          .map(
            (s: { stateId: string }) =>
              combinedStates.find((state) => state.code === s.stateId)!
          )
          .sort((a: IMapState, b: IMapState) => a.code.localeCompare(b.code));

        if (this.mapStates.length) {
          this.selectedStateTab = this.mapStates[0].code;
        }
        for (let state of this.mapStates) {
          if (!state.cities || !state.cities.length)
            this.getAllCitiesByStateCode(state);
        }

        this.cdr.detectChanges();
      }
    });
  }

  private getAllOrganizations(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetAllOrganizations',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        this.spinner.hide();
        if (response.json && response.json.length > 0) {
          this.allOrganizations = response.json;
        } else {
          this.allOrganizations = [];
        }
      },
    });
  }

  private getAllCitiesByStateCode(state: IMapState): void {
    const body: any = {
      Name: 'GetAllCityWithStateCode',
      Params: {
        StateCode: state.code,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response: any) => {
      if (response.json && response.json.length) {
        state.cities = response.json.sort((a: any, b: any) =>
          a.City.localeCompare(b.City)
        );
        this.cdr.detectChanges();
      }
    });
  }

  private getGeoJsonsFile(city: string): void {
    const body = {
      Name: 'GetPolygonsByCityAndState',
      Params: {
        City: city,
        State: this.getStatesToDisplay?.code,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.loadingGlobalPolygons = false;
      this.realTimeGeoJsons = [];
      if (response.json && response.json.length > 0) {
        this.realTimeGeoJsons = response.json.filter(
          (g: any) => g.name != null && g.name.trim().length != 0
        );
        this.realTimeGeoJsons.sort((a, b) => a.name.localeCompare(b.name));
      }
      this.cdr.detectChanges();
    });
  }

  private attachAreasToCampaign(campaignId: number): void {
    const states = Array.from(this.addedStates.keys()).join(', ');
    const cities = JSON.stringify(
      Array.from(this.addedCities.entries())
        .map(([key, value]) => value.map((v) => v + ', ' + key))
        .flat()
    );
    const body = {
      Name: 'SyncMarketSurveyWithCampaignByCityAndState',
      Params: {
        CampaignId: campaignId,
        States: states || '',
        Cities: cities || '',
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  private attachFeaturesToCampaign(campaignId: number): void {
    const PolygonIds = this.getAllAddedFeatures.map((f) => f.id).join(', ');
    const body = {
      Name: 'SyncMarketSurveyWithCampaignByPolygonId',
      Params: {
        CampaignId: campaignId,
        PolygonIds: PolygonIds || '',
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  protected checkStateDisplay(stateCode: string): boolean {
    return this.addedStates.has(stateCode);
  }

  protected checkCityDisplay(stateCode: string, city: string): boolean {
    const cities = this.addedCities.get(stateCode) || [];
    return cities.includes(city);
  }

  protected checkDisplayedGeoJson(id: number): string | number | undefined {
    const geo = this.displayedGeoJsons.find((g) => g.id == id);
    return geo ? geo.featureId : undefined;
  }

  protected checkAddedListTabsDisplay(tab: string): boolean {
    if (tab === 'States') return this.addedStates.size > 0;
    if (tab === 'Cities') return this.addedCities.size > 0;
    if (tab === 'Neighborhoods') return this.getAllAddedFeatures.length > 0;
    return true;
  }

  protected checkAddedFeatureDisplay(id: number): boolean {
    return this.getAllAddedFeatures.find((f) => f.id == id) ? true : false;
  }

  protected addState(stateCode: string, stateName: string): void {
    this.selectedAddedListTab = 'States';
    const condition = this.addedStates.has(stateCode);
    if (!condition) {
      this.addedStates.set(stateCode, stateName);
      const citiesCondition = this.addedCities.has(stateCode);
      if (citiesCondition) this.addedCities.delete(stateCode);
    }
  }

  protected removeState(stateCode: string): void {
    this.addedStates.delete(stateCode);
    this.selectedStateTab = stateCode;

    if (
      this.displayMode == 3 &&
      this.getAllAddedStates().length == 0 &&
      this.getAddedCitiesCount() == 0 &&
      this.getAllAddedFeatures.length == 0
    ) {
      this.displayMode = this.lastDisplayMode;
    }
  }

  protected addCity(stateCode: string, city: string): void {
    this.selectedAddedListTab = 'Cities';
    const condition = this.addedCities.get(stateCode)?.includes(city);
    if (!condition) {
      let cities = this.addedCities.get(stateCode) || [];
      cities = [...cities, city];
      this.addedCities.set(stateCode, [...cities]);
    }
  }

  protected removeCity(stateCode: string, city: string): void {
    let cities = this.addedCities.get(stateCode) || [];
    const condition = cities.includes(city);
    if (condition) {
      cities = cities.filter((c) => c !== city);
      if (cities.length > 0) {
        this.addedCities.delete(stateCode);
        this.addedCities.set(stateCode, cities);
      } else {
        this.addedCities.delete(stateCode);
      }
    }

    if (
      this.displayMode == 3 &&
      this.getAllAddedStates().length == 0 &&
      this.getAddedCitiesCount() == 0 &&
      this.getAllAddedFeatures.length == 0
    ) {
      this.displayMode = this.lastDisplayMode;
    }
  }

  protected addNewFeature(feature: { id: number; name: string }): void {
    const geoFeatureId = this.checkDisplayedGeoJson(feature.id);
    if (!geoFeatureId) {
      const map = this.campaignDrawingService.getMap();
      if (!map) return;
      this.genericMapService
        .loadGeoJsonFileOnMap(
          map,
          `${environment.geoJsonsFilesPath}/${feature.id}.geojson`
        )
        .then((featureId) => {
          if (featureId) {
            this.displayedGeoJsons.push({ featureId: featureId, ...feature });
            this.campaignDrawingService.addNewFeatureWithOriginalData({
              featureId: featureId,
              ...feature,
            });
          }
        });
    } else {
      this.campaignDrawingService.addNewFeatureWithOriginalData({
        featureId: geoFeatureId,
        ...feature,
      });
    }

    this.selectedAddedListTab = 'Neighborhoods';
  }

  protected removeAddedFeature(id: number | string): void {
    const map = this.campaignDrawingService.getMap();
    if (!map) return;
    this.displayedGeoJsons = this.displayedGeoJsons.filter(
      (g) => g.featureId != id
    );
    this.campaignDrawingService.removeFeatureById(map, id);

    if (
      this.displayMode == 3 &&
      this.getAllAddedStates().length == 0 &&
      this.getAddedCitiesCount() == 0 &&
      this.getAllAddedFeatures.length == 0
    ) {
      this.displayMode = this.lastDisplayMode;
    }
  }

  protected viewNeighborhoods(city: string): void {
    this.displayMode = 2;
    this.lastDisplayMode = 1;
    this.selectedCityName = city;
    this.loadingGlobalPolygons = true;
    this.cdr.detectChanges();
    this.getGeoJsonsFile(city);
  }

  protected toggleJeoJsonOnMap(geoJson: { id: number; name: string }): void {
    const geoFeatureId = this.checkDisplayedGeoJson(geoJson.id);

    const map = this.campaignDrawingService.getMap();
    if (!map) return;
    if (geoFeatureId) {
      this.genericMapService.removeFeatureById(map, geoFeatureId);
      this.displayedGeoJsons = this.displayedGeoJsons.filter(
        (g) => g.id != geoJson.id
      );
    } else {
      this.genericMapService
        .loadGeoJsonFileOnMap(
          map,
          `${environment.geoJsonsFilesPath}/${geoJson.id}.geojson`
        )
        .then((featureId) => {
          if (featureId)
            this.displayedGeoJsons.push({ featureId: featureId, ...geoJson });
        });
    }
  }

  protected get getStatesToDisplay(): IMapState | null {
    const state = this.mapStates.find(
      (state) => state.code === this.selectedStateTab
    );
    return state || this.mapStates[0] || null;
  }

  protected get getAllAddedFeatures(): {
    featureId: number | string;
    id: number;
    name: string;
  }[] {
    return this.campaignDrawingService.getAllAddedFeatures();
  }

  protected getAllAddedStates(): { key: string; value: string }[] {
    return Array.from(this.addedStates.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  protected getAllAddedCities(): { key: string; value: string[] }[] {
    return Array.from(this.addedCities.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  protected getAddedCitiesCount(): number {
    return Array.from(this.addedCities.entries())
      .map(([key, value]) => value.length)
      .reduce((acc, len) => acc + len, 0);
  }

  protected getGeoJsonFeatureId(id: number): string | number {
    const geo = this.getAllAddedFeatures.find((g) => g.id == id);
    return geo!.featureId;
  }

  protected openNewCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true });
  }

  protected createNewCampaign(): void {
    if (!this.campaignMinSize || !this.campaignMaxSize) {
      alert('Plese select a min and max size first.');
      this.router.navigate(['/campaigns'], { replaceUrl: true });
      return;
    }
    if (!this.organizationId) {
      alert('Plese select a buybox first.');
      return;
    }

    if (this.campaignName.trim().length == 0) {
      alert('Plese set campaign name first.');
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'CreateCampaign ',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        OrganizationId: this.organizationId,
        minunitsize: this.campaignMinSize,
        maxunitsize: this.campaignMaxSize,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0 && response.json[0].id) {
        setTimeout(() => {
          this.spinner.hide();
          this.modalService.dismissAll();
          this.router.navigate(['/campaigns']);
        }, 1000);
        this.attachAreasToCampaign(response.json[0].id);
        this.attachFeaturesToCampaign(response.json[0].id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.campaignDrawingService.removeAllAddedFeatures();
  }
}
