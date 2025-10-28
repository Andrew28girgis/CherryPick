import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RefreshService {
  private refreshOrganizationsSource = new Subject<void>();
  private refreshUserPagesSource = new Subject<void>();
  refreshOrganizations$ = this.refreshOrganizationsSource.asObservable();
  refreshUserPages$ = this.refreshUserPagesSource.asObservable();

  triggerRefreshOrganizations(): void {
    this.refreshOrganizationsSource.next();
  }
  private triggerPolygonSaveSource = new Subject<number>();
  triggerPolygonSave$ = this.triggerPolygonSaveSource.asObservable();

  requestPolygonSave(tenantId: number): void {
    this.triggerPolygonSaveSource.next(tenantId);
  }

  private polygonSavedDataSource = new Subject<string>();
  polygonSavedData$ = this.polygonSavedDataSource.asObservable();

  sendPolygonSavedData(data: string): void {
    this.polygonSavedDataSource.next(data);
  }
  


  triggerUserPagesRefresh() {
    this.refreshUserPagesSource.next();
  }
}
