import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly LOGIN_DATE_KEY = 'loginDate';
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    // Save login date timestamp
    localStorage.setItem(this.LOGIN_DATE_KEY, new Date().toISOString().split('T')[0]);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const loginDate = localStorage.getItem(this.LOGIN_DATE_KEY);
    if (!token || !loginDate) {
      return null;
    }
    const today = new Date().toISOString().split('T')[0];
    if (loginDate === today) {
      return token;
    } else {
      this.logout();
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.LOGIN_DATE_KEY);
  }
  
  isLoggedInToday(): boolean {
    return this.getToken() !== null;
  }
}