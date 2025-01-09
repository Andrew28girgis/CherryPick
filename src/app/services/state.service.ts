import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private selectedSS: number = 0;

  setSelectedSS(value: number) {
    this.selectedSS = value;
  }

  getSelectedSS(): number {
    return this.selectedSS;
  }
} 