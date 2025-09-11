import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftLoginService {
  constructor() {}

  public getSigninUrl(ContactId: number): string {
    return `${environment.api}/auth/signin?ContactId=${ContactId}`;
  }
}