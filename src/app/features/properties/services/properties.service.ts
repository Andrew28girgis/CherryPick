import { Injectable } from '@angular/core';
import { IProperty } from '../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private properties: IProperty[] = [];

  constructor() {}

  setProperties(properties: IProperty[]): void {
    this.properties = [...properties];
  }

  getProperties(): IProperty[] {
    if (this.properties.length) return this.properties;
    return [];
  }
}
