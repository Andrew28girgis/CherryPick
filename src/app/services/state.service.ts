import { Injectable } from '@angular/core';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShareOrg } from 'src/models/shareOrg';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private selectedSS: number | null = null;
  private buyboxCategories: BuyboxCategory[] = [];
  private shoppingCenters: Center[] = [];
  private standAlone: Place[] = [];
  private buyboxPlaces: BbPlace[] = [];
  private shareOrg: ShareOrg[] = [];

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

  clearAll() {
    this.buyboxCategories = [];
    this.shoppingCenters = [];
    this.standAlone = [];
    this.buyboxPlaces = [];
    this.shareOrg = [];
    this.selectedSS = null;
  }
} 