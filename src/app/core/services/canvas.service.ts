import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  constructor(private http: HttpClient) {}

  getGPTAction(request: any) {
    return this.http.post<any>(`${environment.api}/GetGPTAction`, request);
  }
}
