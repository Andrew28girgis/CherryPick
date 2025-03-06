import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiServiceService {
  constructor(private http: HttpClient) {}

  public GenericAPI(body: any) {
    return this.http
      .post<any>(`${environment.api}/GenericAPI/Execute`, body)
      .pipe();
  }
  
}
