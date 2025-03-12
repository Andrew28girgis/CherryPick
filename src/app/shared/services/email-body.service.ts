import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private myVariableSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // Observable for components to subscribe to
  myVariable$ = this.myVariableSubject.asObservable();

  constructor() {}

  // Method to update the value
  updateVariable(newValue: any): void { 
    this.myVariableSubject.next(newValue);
  }

  // Method to get current value
  getCurrentValue(): any {
    return this.myVariableSubject.getValue();
  }
}
