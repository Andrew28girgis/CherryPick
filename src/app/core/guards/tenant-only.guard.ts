import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TenantOnlyGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree { 
    const isLandlordView = this.isLandlordView(); 
    if (isLandlordView) { 
      return this.router.parseUrl('/landlord');
    } 
    return true;
  }

  private isLandlordView(): boolean {
    return localStorage.getItem('userView') === 'landlord';
  }
}
