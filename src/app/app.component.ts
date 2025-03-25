import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SidbarService } from './core/services/sidbar.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  display: boolean = true;
  isHovering = false;
  isMarketSurveyRoute = false;

  isSidebarExpanded = false;
  private sidebarSubscription: Subscription | null = null;

  constructor(private router: Router, private sidebarService: SidbarService) {}

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
    this.sidebarSubscription = this.sidebarService.isSidebarExpanded.subscribe(
      (isExpanded) => {
        this.isSidebarExpanded = isExpanded;
      }
    );
  }
  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
  onSidebarHover(isHovering: boolean) {
    this.isHovering = isHovering;
  }
}