import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidbarService {
  // For sidebar expansion state
  private isSidebarExpandedSource = new BehaviorSubject<boolean>(true);
  isSidebarExpanded = this.isSidebarExpandedSource.asObservable();
  
  // For sidebar collapse state (used by header)
  private isCollapsedSource = new BehaviorSubject<boolean>(false);
  isCollapsed = this.isCollapsedSource.asObservable();

  toggleSidebar() {
    // Toggle the expanded state
    const currentExpandedState = this.isSidebarExpandedSource.value;
    this.isSidebarExpandedSource.next(!currentExpandedState);
    
    // Also update the collapsed state (they're opposites)
    this.isCollapsedSource.next(currentExpandedState);
  }



  setSidebarState(isExpanded: boolean) {
    this.isSidebarExpandedSource.next(isExpanded);
  }
}

