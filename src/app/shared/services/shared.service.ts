import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private activeComponent = new BehaviorSubject<string>('');
  activeComponent$ = this.activeComponent.asObservable();

  setActiveComponent(componentName: string) {
    this.activeComponent.next(componentName);
  }

  getActiveComponent() {
    return this.activeComponent.value;
  }
} 