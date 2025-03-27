import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CadenceService {
  private kanbanId = new BehaviorSubject<number>(0); // Initial value

  constructor() {}

  getKanbanId(): Observable<number> {
    return this.kanbanId.asObservable();
  }

  updateKanbanId(id: number): void {
    this.kanbanId.next(id);
  }
  
}
