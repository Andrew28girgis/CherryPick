import { Injectable } from '@angular/core';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center, Place } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
import { permission } from 'src/app/shared/models/permission';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private selectedSS: number | null = null;
  private buyboxCategories: BuyboxCategory[] = [];
  private shoppingCenters: Center[] = [];
  private standAlone: Place[] = [];
  private buyboxPlaces: BbPlace[] = [];
  private Permission: permission[] = [];

  private shareOrg: ShareOrg[] = [];
  private scrollPosition: number = 0;
  placesRepresentative: boolean | undefined;

  private shoppingCentersSubject = new BehaviorSubject<Center[]>([]);
  shoppingCenters$ = this.shoppingCentersSubject.asObservable();

  private buyboxCategoriesSubject = new BehaviorSubject<BuyboxCategory[]>([]);
  buyboxCategories$ = this.buyboxCategoriesSubject.asObservable();

  private buyboxPlacesSubject = new BehaviorSubject<BbPlace[]>([]);
  buyboxPlaces$ = this.buyboxPlacesSubject.asObservable();

  private shareOrgSubject = new BehaviorSubject<ShareOrg[]>([]);
  shareOrg$ = this.shareOrgSubject.asObservable();

  setShoppingCenters(centers: Center[]): void {
    this.shoppingCentersSubject.next(centers);
  }

  getShoppingCentersSnapshot(): Center[] {
    return this.shoppingCentersSubject.getValue();
  }

  setBuyboxCategories(categories: BuyboxCategory[]): void {
    this.buyboxCategoriesSubject.next(categories);
  }

  setBuyboxPlaces(places: BbPlace[]): void {
    this.buyboxPlacesSubject.next(places);
  }

  setShareOrg(org: ShareOrg[]): void {
    this.shareOrgSubject.next(org);
  }

  // Selected SS methods
  setSelectedSS(value: number) {
    this.selectedSS = value;
  }

  getSelectedSS(): number | null {
    return this.selectedSS;
  }

  // Data storage methods
  // setBuyboxCategories(categories: BuyboxCategory[]) {
  //   this.buyboxCategories = categories;
  // }

  getBuyboxCategories(): BuyboxCategory[] {
    return this.buyboxCategories;
  }

  // setShoppingCenters(centers: Center[]) {
  //   this.shoppingCenters = centers;
  // }

  getShoppingCenters(): Center[] {
    return this.shoppingCenters;
  }

  setStandAlone(places: Place[]) {
    this.standAlone = places;
  }

  getStandAlone(): Place[] {
    return this.standAlone;
  }

  // setBuyboxPlaces(places: BbPlace[]) {
  //   this.buyboxPlaces = places;
  // }

  getBuyboxPlaces(): BbPlace[] {
    return this.buyboxPlaces;
  }

  // setShareOrg(org: ShareOrg[]) {
  //   this.shareOrg = org;
  // }

  getShareOrg(): ShareOrg[] {
    return this.shareOrg;
  }

  setPermission(permission: permission[]) {
    this.Permission = permission;
  }

  setPlacesRepresentative(PlacesRepresentative: any) {
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
    this.buyboxPlaces = [];
    this.shareOrg = [];
    this.selectedSS = null;
    this.Permission = [];
  }
}
