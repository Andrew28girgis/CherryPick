import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RefreshService {
  private refreshOrganizationsSource = new Subject<void>();
  refreshOrganizations$ = this.refreshOrganizationsSource.asObservable();

  triggerRefreshOrganizations(): void {
    this.refreshOrganizationsSource.next();
  }
  private triggerPolygonSaveSource = new Subject<string>();
  triggerPolygonSave$ = this.triggerPolygonSaveSource.asObservable();

  requestPolygonSave(tenantName: string): void {
    this.triggerPolygonSaveSource.next(tenantName);
  }

  private polygonSavedDataSource = new Subject<string>();
  polygonSavedData$ = this.polygonSavedDataSource.asObservable();

  sendPolygonSavedData(data: string): void {
    this.polygonSavedDataSource.next(data);
  }
}
