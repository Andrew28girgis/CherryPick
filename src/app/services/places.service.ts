import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  constructor(private http: HttpClient) {}

  public GetBuyBoxPlaces(buyBoxId: any) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetBuyBoxPlaces?buyboxid=${buyBoxId}`
      )
      .pipe();
  }

  public GetBuyBoxOnePlace(id: number, buyboxid: number) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetBuyBoxPlaces?placeId=${id}&buyboxid=${buyboxid}`
      )
      .pipe();
  }

  public GetFilteredPlacesLookup(buyboxid: number) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetFilteredPlacesLookup?buyboxid=${buyboxid}`
      )
      .pipe();
  }

  public loginUser(message: any) {
    return this.http
      .post<any[]>(`${environment.api}/BuyBox/Login`, message)
      .pipe();
  }

  public GetFilteredBuyBoxPlaces(message: any, buyboxid: number) {
    return this.http
      .post<any>(
        `${environment.api}/BuyBox/GetFilteredBuyBoxPlaces?buyboxid=${buyboxid}`,
        message
      )
      .pipe();
  }

  public UpdateBuyBoxWorkSpacePlace(message: any) {
    return this.http
      .post<any>(`${environment.api}/BuyBox/UpdatePlaceNote`, message)
      .pipe();
  }

  public GetNearbyBuildings(lat: number, lng: number) {
    return this.http
      .get<any>(
        `${environment.api}/Building/GetNearbyBuildings?lat=${lat}&lng=${lng}&distance=3000`
      )
      .pipe();
  }

  public UpdatePlaceAcceptable(message: any) {
    return this.http
      .post<any>(`${environment.api}/BuyBox/UpdatePlaceAcceptable`, message)
      .pipe();
  }

  public GetAllFilesFromPlace(placeId: number) {
    return this.http
      .get<any>(
        `${environment.api}/Scoutlyn/GetAllFilesFromPlace?PlaceId=${placeId}`
      )
      .pipe();
  }

  public SharePlace(message: any) {
    return this.http
      .post<any>(`${environment.api}/BuyBox/SharePlace`, message)
      .pipe();
  }

  token!: any;
  SharedId!: any;
  public GetSharedPlace(token: any, sharedId: number, buyboxid: number) {
    this.token = token;
    this.SharedId = sharedId;
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetSharedPlace?token=${token}&sharedId=${sharedId}&buyboxid=${buyboxid}`
      )
      .pipe();
  }

  getSharedToken(): string {
    return this.token;
  }

  getSharedId(): string {
    return this.SharedId;
  }

  public UpdateBuyBoxUserEstimatedNumbers(message: any) {
    return this.http
      .post<any>(
        `${environment.api}/BuyBox/UpdateBuyBoxUserEstimatedNumbers`,
        message
      )
      .pipe();
  }

  public GetUserEstimatedNumbers(placeid: number, buyboxid: number) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetUserEstimatedNumbers?placeid=${placeid}&buyboxid=${buyboxid}`,
        { withCredentials: true }
      )
      .pipe();
  }

  public GetUserEstimatedNumbersForShared(
    placeid: number,
    sharedId: number,
    buyboxid: number
  ) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetUserEstimatedNumbers?placeid=${placeid}&sharedId=${sharedId}&buyboxid=${buyboxid}`,
        { withCredentials: true }
      )
      .pipe();
  }

  public GetBuyBoxNewPlaces(buyBoxId: any) {
    return this.http
      .get<any>(
        `${environment.api}/BuyBox/GetBuyBoxNewPlaces?buyboxid=${buyBoxId}`
      )
      .pipe();
  }

  public GetActionForSameBuyBox(buyBoxId: any) {
    return this.http
      .get<any>(
        `${environment.api}/buybox/GetActionForSameBuyBox?buyboxid=${buyBoxId}`
      )
      .pipe();
  }

  GetUserBuyBoxes(): Observable<boolean> {
    return this.http
      .get<boolean>(`${environment.api}/BuyBox/GetUserBuyBoxes`)
      .pipe();
  }

  public GetAllWorkspacesBuyBox(id: number) {
    return this.http
      .get<any>(`${environment.api}/BuyBox/GetAllWorkspaces?buyboxid=${id}`)
      .pipe();
  }

  public BuyBoxesNumbers(id: number) {
    return this.http
      .get<any>(`${environment.api}/BuyBox/BuyBoxesNumbers?buyboxid=${id}`)
      .pipe();
  }

  public LoginWithContact(message: any) {
    return this.http
      .post<any>(`${environment.api}/BuyBox/LoginWithContact`, message)
      .pipe();
  }

  public getEverything(id: number) {
    return this.http
      .get<any>(`${environment.api}/Place/sources?id=${id}`)
      .pipe();
  }

  public GetNearestBuyBoxPlaces(OrganizationId: number, PlaceId: number) {
    return this.http
      .get<any>(
        `${environment.api}/Buybox/GetNearestBuyBoxPlaces?OrganizationId=${OrganizationId}&PlaceId=${PlaceId}`
      )
      .pipe();
  }

  public NearestFiveComparable(PlaceId: number, OrganizationId: number) {
    return this.http
      .get<any>(
        `${environment.api}/Place/PlaceComparable?placeId=${PlaceId}&OrganizationId=${OrganizationId}`
      )
      .pipe();
  }

  public getSpecificPlaces(PlaceId: number, buyboxId: number) {
    return this.http
      .get<any>(
        `${environment.api}/Place/SpecificPlaces?placeId=${PlaceId}&buyboxId=${buyboxId}`
      )
      .pipe();
  }

  public GetBrokerCategories() {
    return this.http
      .get<any>(`${environment.api}/BuyBox/GetBrokerCategories`)
      .pipe();
  }
  
  public GetAllBuyBoxComparables(buyBoxId:number) {
    return this.http
      .get<any>(`${environment.api}/BuyBox/GetAllBuyBoxComparables?buyBoxId=${buyBoxId}`)
      .pipe();
  }

  public GetShoppingCenterPlaces(CenterName:string,PlaceId:number,BuyBoxId:number) {
    return this.http
      .get<any>(`${environment.api}/Scoutlyn/GetShoppingCenterPlaces?CenterName=${CenterName}&PlaceId=${PlaceId}&BuyBoxId=${BuyBoxId}`)
      .pipe();
  }
  
}
