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
export class LandlordAccessGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Check if the current view is landlord
    const isLandlordView = this.isLandlordView();

    // If user is in tenant view, block access to landlord routes
    if (!isLandlordView) {
      // Redirect to dashboard if tenant tries to access landlord routes
      return this.router.parseUrl('/summary');
    }

    // Allow landlord users to access landlord routes
    return true;
  }

  private isLandlordView(): boolean {
    // Check if the user is in landlord view
    return localStorage.getItem('userView') === 'landlord';
  }
}
