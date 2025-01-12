import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private isDarkThemeSubject = new BehaviorSubject<boolean>(this.getInitialThemeState());
  isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  private getInitialThemeState(): boolean {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkThemeSubject.value;
    this.isDarkThemeSubject.next(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', newTheme);
  }

  initializeTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkThemeSubject.value);
  }
}