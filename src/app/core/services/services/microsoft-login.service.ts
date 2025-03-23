import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftLoginService {
  constructor(private http: HttpClient) {}

  public getSigninUrl(ContactId: number): string {
    return `${environment.api}/auth/signin?ContactId=${ContactId}`;
  }
}