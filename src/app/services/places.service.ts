import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  constructor(private http: HttpClient) {}

  public GetBuyBoxPlaces(buyBoxId: any) {
    return this.http.get<any>(`${environment.api}/BuyBox/GetBuyBoxPlaces?buyboxid=${buyBoxId}`);
  }

  public GetBrokerCategories() {
    return this.http.get<any>(`${environment.api}/BuyBox/GetBrokerCategories`);
  }

  public GetAllBuyBoxComparables(buyBoxId: number) {
    return this.http.get<any>(`${environment.api}/BuyBox/GetAllBuyBoxComparables?buyBoxId=${buyBoxId}`);
  }

  public GenericAPI(body: any) {
    return this.http.post<any>(`${environment.api}/GenericAPI/Execute`, body);
  }

  public loginUser(message: any) {
    return this.http.post<any[]>(`${environment.api}/BuyBox/Login`, message);
  }

  public UpdateBuyBoxWorkSpacePlace(message: any) {
    return this.http.post<any>(`${environment.api}/BuyBox/UpdatePlaceNote`, message);
  }

  GetUserBuyBoxes(): Observable<any> {
    return this.http.get<any>(`${environment.api}/BuyBox/GetUserBuyBoxes`);
  }

  public generateEmail(promptId: number, context: string) {
    const apiUrl = `${environment.api}/PromptHub/GenerateEmail`;
    const body = {
      promptId,
      context,
    };
    return this.http.post<any>(apiUrl, body);
  }

  // Add other methods as needed from your original service
}
