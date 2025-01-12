import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly STORAGE_KEY = 'sidebarCollapsed';

  getCollapsedState(): boolean {
    return sessionStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  setCollapsedState(collapsed: boolean): void {
    sessionStorage.setItem(this.STORAGE_KEY, collapsed.toString());
  }
}