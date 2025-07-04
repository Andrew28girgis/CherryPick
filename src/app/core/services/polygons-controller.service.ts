import { Injectable } from '@angular/core';
import { PlacesService } from './places.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PolygonsControllerService {
  constructor(
    private httpClient: HttpClient,
    private placesService: PlacesService
  ) {}

  getAllPolygons(buyBoxId: number): Observable<any> {
    const body: any = {
      Name: 'RetrieveGeoJsons',
      Params: {
        BuyBoxId: buyBoxId,
      },
    };

    return this.placesService.GenericAPI(body);
  }

  insertNewPolygons(data: {
    contactId: number;
    buyBoxId: number;
    name: string;
    city: string;
    state: string;
    geoJson: any;
    center: string;
    radius: string;
  }): Observable<any> {
    const body: any = {
      State: data.state,
      City: data.city,
      Name: data.name,
      PropertyType: 'Polygon',
      ContactId: data.contactId,
      BuyBoxId: data.buyBoxId,
      CreationDate: new Date(),
      Json: data.geoJson,
      Center: data.center,
      Radius: data.radius,
    };

    return this.httpClient.post<any>(
      `${environment.api}/GeoJson/AddGeoJson`,
      body
    );
  }

  updatePolygon(
    id: number,
    data: {
      contactId: number;
      buyBoxId: number;
      name: string;
      city: string;
      state: string;
      geoJson: any;
      center: string;
      radius: string;
    }
  ): Observable<any> {
    const body: any = {
      State: data.state,
      City: data.city,
      Name: data.name,
      PropertyType: 'Polygon',
      ContactId: data.contactId,
      BuyBoxId: data.buyBoxId,
      CreationDate: new Date(),
      Json: data.geoJson,
      Center: data.center,
      Radius: data.radius,
    };

    return this.httpClient.post<any>(
      `${environment.api}/GeoJson/UpdateGeoJson/${id}`,
      body
    );
  }

  deletePolygon(id: number): Observable<any> {
    const body: any = {
      Name: 'DeleteGeoJson',
      Params: {
        Id: id,
      },
    };

    return this.placesService.GenericAPI(body);
  }

  getPolygonProperties(polygonId: number): Observable<any> {
    const body: any = {
      Name: 'GetPolygonsShoppingCenters',
      Params: {
        PolygonId: polygonId,
      },
    };

    return this.placesService.GenericAPI(body);
  }

  getExplorePolygonProperties(polygonId: number): Observable<any> {
    const body: any = {
      Name: 'GetShoppingcentersIntersectingPolygon',
      Params: {
        PolygonId: polygonId,
      },
    };

    return this.placesService.GenericAPI(body);
  }

  getPolygonsByName(object: any): Observable<any> {
    return this.httpClient.post(`${environment.api}/GetLocationData`, object);
  }

  attachPolygonToBuyBox(buyBoxId: number, polygonId: number): Observable<any> {
    const body: any = {
      Name: 'AttachPolygonToBuyBox',
      Params: {
        BuyBoxId: buyBoxId,
        PolygonId: polygonId,
      },
    };

    return this.placesService.GenericAPI(body);
  }
}
