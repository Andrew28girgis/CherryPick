import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PropertiesServiceService {
  groupedPropertiesArray: any[] = [];
  buyboxId: any;

  constructor() {}

  getbuyboxId() {
    return this.buyboxId;
  }

  setbuyboxId(buyboxId: any) {
    this.buyboxId = buyboxId;
  }

  getGroupedPropertiesArray() {
    return this.groupedPropertiesArray;
  }

  setGroupedPropertiesArray(properties: any[]) {
    this.groupedPropertiesArray = properties;
  }
}
