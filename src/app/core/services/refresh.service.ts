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
}
