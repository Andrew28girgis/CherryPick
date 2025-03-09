import { Component } from '@angular/core';
import { getDomainConfig } from './config';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  display: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(() => {

      this.display = !(
        this.router.url === '/' ||
        this.router.url === '/login' ||
        this.router.url.startsWith('/home') ||
        this.router.url.startsWith('/landing')
      );
    });

    const domain = window.location.href;
    const config = getDomainConfig(domain);
    this.logoUrl = config.logo;
    this.color = config.color;
    document.documentElement.style.setProperty('--app-color', this.color);
    this.fontFamily = config.fontFamily;
    document.documentElement.style.setProperty('--app-font', this.fontFamily);
  }
}
