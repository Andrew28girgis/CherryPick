import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { UserViewService } from './user-view.service';

@Injectable({
  providedIn: 'root',
})
export class RouteGuardService implements CanActivate {
  constructor(
    private router: Router,
    private userViewService: UserViewService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Get the requested URL
    const requestedUrl = state.url;

    // Check if the requested URL is a landlord route
    const isRequestingLandlordRoute = requestedUrl.includes('/landlord');

    // Get current view from service
    const currentView = this.userViewService.getCurrentView();
    const isCurrentlyLandlordView = currentView === 'landlord';

    // Public routes should always be accessible
    if (
      requestedUrl === '/' ||
      requestedUrl === '/login' ||
      requestedUrl === '/tos' ||
      requestedUrl.startsWith('/landing/')
    ) {
      return true;
    }

    // If we're in landlord view and trying to access a non-landlord route
    if (isCurrentlyLandlordView && !isRequestingLandlordRoute) {
      return this.router.parseUrl('/landlord');
    }

    // If we're in tenant view and trying to access a landlord route
    if (!isCurrentlyLandlordView && isRequestingLandlordRoute) {
      return this.router.parseUrl('/dashboard');
    }

    // Allow the navigation
    return true;
  }
}
