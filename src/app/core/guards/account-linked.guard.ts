import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PlacesService } from '../services/places.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountLinkedGuard implements CanActivate {
  constructor(
    private router: Router,
    private genericApiService: PlacesService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    // Skip the tasks route itself
    if (state.url === '/overview') {
      return true;
    }

    const guid = localStorage.getItem('guid');
    if (!guid) {
      this.router.navigate(['/overview']);
      return false;
    }

    try {
      const contactRequestBody = {
        Name: 'GetContactDataFromGUID',
        Params: {
          GUIDSignature: guid,
        },
      };

      const response = await firstValueFrom(this.genericApiService.GenericAPI(contactRequestBody));
      
      // Allow navigation if at least one account is linked
      if (response.json && response.json.length) {
        const hasGoogleToken = response.json[0].googleAccessToken;
        const hasMicrosoftToken = response.json[0].microsoftAccessToken;
        
        if (!hasGoogleToken && !hasMicrosoftToken) {
          this.router.navigate(['/overview']);
          return false;
        }
        return true;
      }

      this.router.navigate(['/overview']);
      return false;
    } catch (error) {
      this.router.navigate(['/overview']);
      return false;
    }
  }
} 