import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrganizationsService {
  constructor(private http: HttpClient) {}

  public GetOrganizationDetails(organizationId: any) {
    return this.http
      .get<any>(`${environment.api}/organization/data/${organizationId}`)
      .pipe();
  }

  public GetBrokerOrganizations() {
    return this.http
      .get<any>(`${environment.api}/BuyBox/GetBrokerOrganizations`)
      .pipe();
  }
  
}
