import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertiesServiceService {
  private groupedPropertiesArray: any[] = [];

  constructor(private http: HttpClient) {}

  getbuyboxId(): number {
    return parseInt(localStorage.getItem('buyboxId') || '0');
  }

  setbuyboxId(buyboxId: number) {
    localStorage.setItem('buyboxId', buyboxId.toString());
  }

  GetBuyBoxPlaces(buyboxId: number): Observable<any> {
    return this.http.get(`${environment.api}/buybox/places/${buyboxId}`);
  }

  setGroupedPropertiesArray(properties: any[]) {
    this.groupedPropertiesArray = properties;
  }

  getGroupedPropertiesArray() {
    return this.groupedPropertiesArray;
  }
}
