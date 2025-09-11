import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmilyService {
  private emilyCheckList = new BehaviorSubject<any>(null); // Initial value

  constructor() {}

  getCheckList(): Observable<any> {
    return this.emilyCheckList.asObservable();
  }

  updateCheckList(checkList: any): void {
    this.emilyCheckList.next(checkList);
    sessionStorage.setItem(
      'buyboxChecklist',
      JSON.stringify(this.emilyCheckList.value)
    );
  }
}
