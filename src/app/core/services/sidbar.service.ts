import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidbarService {
  public isCollapsed = new BehaviorSubject<boolean>(true); // Changed to true for default collapsed state
  public isSidebarExpanded = new BehaviorSubject<boolean>(false); // Changed to false for default collapsed state

  constructor() {}

  toggleSidebar() {
    this.isCollapsed.next(!this.isCollapsed.value);
  }

  setSidebarState(isExpanded: boolean) {
    this.isSidebarExpanded.next(isExpanded);
  }
}