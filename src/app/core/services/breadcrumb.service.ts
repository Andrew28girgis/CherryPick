import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbs = new BehaviorSubject<BreadcrumbItem[]>([]);

  constructor() {}

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.breadcrumbs.next(items);
  }

  addBreadcrumb(item: BreadcrumbItem) {
    const current = this.breadcrumbs.getValue();
    this.breadcrumbs.next([...current, item]);
  }

  updateLastBreadcrumb(item: BreadcrumbItem) {
    const current = this.breadcrumbs.getValue();
    if (current.length > 0) {
      current[current.length - 1] = item;
      this.breadcrumbs.next([...current]);
    }
  }

  removeLastBreadcrumb() {
    const current = this.breadcrumbs.getValue();
    if (current.length > 0) {
      this.breadcrumbs.next(current.slice(0, -1));
    }
  }

  getBreadcrumbs() {
    return this.breadcrumbs.asObservable();
  }

  clearBreadcrumbs() {
    this.breadcrumbs.next([]);
  }
}
