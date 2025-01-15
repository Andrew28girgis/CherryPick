 import { Injectable } from '@angular/core';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShareOrg } from 'src/models/shareOrg';
import { permission } from 'src/models/permission';
 
@Injectable({
  providedIn: 'root'
})
export class StateService {
  private selectedSS: number | null = null;
  private buyboxCategories: BuyboxCategory[] = [];
  private shoppingCenters: Center[] = [];
  private standAlone: Place[] = [];
  private buyboxPlaces: BbPlace[] = [];
  private Permission:permission[] = [];

  private shareOrg: ShareOrg[] = []; 
  private scrollPosition: number = 0;
  placesRepresentative:boolean | undefined;

  // Selected SS methods
  setSelectedSS(value: number) {
    this.selectedSS = value;
  }

  getSelectedSS(): number | null {
    return this.selectedSS;
  }

  // Data storage methods
  setBuyboxCategories(categories: BuyboxCategory[]) {
    this.buyboxCategories = categories;
  }

  getBuyboxCategories(): BuyboxCategory[] {
    return this.buyboxCategories;
  }

  setShoppingCenters(centers: Center[]) {
    this.shoppingCenters = centers;
  }

  getShoppingCenters(): Center[] {
    return this.shoppingCenters;
  }

  setStandAlone(places: Place[]) {
    this.standAlone = places;
  }

  getStandAlone(): Place[] {
    return this.standAlone;
  }

  setBuyboxPlaces(places: BbPlace[]) {
    this.buyboxPlaces = places;
  }

  getBuyboxPlaces(): BbPlace[] {
    return this.buyboxPlaces;
  }

  setShareOrg(org: ShareOrg[]) {
    this.shareOrg = org;
  }

  getShareOrg(): ShareOrg[] {
    return this.shareOrg;
  }
 
  setPermission(permission: permission[]) {
    this.Permission = permission;
  }

  setPlacesRepresentative(PlacesRepresentative:any) {
    this.placesRepresentative = PlacesRepresentative;
  }

  getPlacesRepresentative(): boolean | undefined {
    return this.placesRepresentative;
  }

  getPermission(): permission[] {
    return this.Permission;
  }

  clearAll() {
    this.buyboxCategories = [];
    this.shoppingCenters = [];
    this.standAlone = [];
    this.buyboxPlaces = [];
    this.shareOrg = [];
    this.selectedSS = null; 
    this.Permission = [];
  }

} 