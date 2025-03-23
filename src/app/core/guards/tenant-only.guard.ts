import { Injectable } from "@angular/core"
import  { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from "@angular/router"
import  { Observable } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class TenantOnlyGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if the current view is landlord
    const isLandlordView = this.isLandlordView()

    // If user is in landlord view, block access to tenant routes
    if (isLandlordView) {
      // Redirect to landlord dashboard if landlord tries to access tenant routes
      return this.router.parseUrl("/landlord")
    }

    // Allow tenant users to access tenant routes
    return true
  }

  private isLandlordView(): boolean {
    // Check if the user is in landlord view
    return localStorage.getItem("userView") === "landlord"
  }
}

