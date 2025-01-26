import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidbarService {
  private collapsed = new BehaviorSubject<boolean>(true);
  isCollapsed = this.collapsed.asObservable(); 

  toggleSidebar() {
    this.collapsed.next(!this.collapsed.value); 
  }

  setCollapsedState(state: boolean) {
    this.collapsed.next(state); 
  }
}
