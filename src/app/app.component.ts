import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  display: boolean = true;
  isMarketSurveyRoute = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(() => {
      // Check for market survey routes
      this.isMarketSurveyRoute = this.router.url.startsWith('/market-survey');
      // Existing display logic
      this.display = !(
        this.router.url === '/' ||
        this.router.url === '/login' ||
        this.router.url === '/tos' ||
        this.router.url.startsWith('/home') ||
        this.router.url.startsWith('/market-survey') ||
        this.router.url.startsWith('/landing')
      );
    });
  }
}
