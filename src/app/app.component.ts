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
export class AppComponent {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  display: boolean = true;
  isHovering = false; // Track hover state

  isSidebarExpanded = false; // Changed to false for default collapsed state
  private sidebarSubscription: Subscription | null = null;

  constructor(private router: Router, private sidebarService: SidbarService) {}

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.display = !(
        this.router.url === '/' ||
        this.router.url === '/login' ||
        this.router.url === '/tos'||
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
    // Handle hover state changes from sidebar
    onSidebarHover(isHovering: boolean) {
      this.isHovering = isHovering;
    }
}
