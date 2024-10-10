import { Component } from '@angular/core';
import { getDomainConfig } from './config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;

  ngOnInit() {
    const domain = window.location.href;
    const config = getDomainConfig(domain);
    this.logoUrl = config.logo;
    this.color = config.color;
    document.documentElement.style.setProperty('--app-color', this.color);
    this.fontFamily = config.fontFamily;
    document.documentElement.style.setProperty('--app-font', this.fontFamily);
  }

}
