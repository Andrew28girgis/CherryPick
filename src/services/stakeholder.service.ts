import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from '../models/userKanban';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StakeholderService {
  constructor(private http: HttpClient) {}

  getStakeholders(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${environment.api}/stakeholders`);
  }

  updateStakeholder(stakeholder: Organization): Observable<any> {
    return this.http.put(`${environment.api}/stakeholders/${stakeholder.ID}`, stakeholder);
  }

  deleteStakeholder(id: number | undefined): Observable<any> {
    return this.http.delete(`${environment.api}/stakeholders/${id}`);
  }

  getFilteredStakeholders(filters: any): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${environment.api}/stakeholders`, { params: filters });
  }
} 