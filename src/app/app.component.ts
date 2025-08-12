import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isMarketSurveyRoute = false;
  display: boolean = false;
  isMobile = false;
  isSocialView: boolean = false;
  hideSidebar = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private placeService: PlacesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const apiMode = this.localStorage.getItem('apiMode');
    if (apiMode && JSON.parse(apiMode)) {
      this.placeService.setAppMode('api');
    }
    this.checkScreenSize();
    this.isSocialView =
      this.localStorage.getItem('currentViewDashBord') === '5';

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.activatedRoute;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        currentRoute.data.subscribe((data) => {
          this.display = !data['hideHeader'];
          this.hideSidebar = data['hideSidebar'] === true;

          // Add logging here
          console.log('Navigation to:', this.router.url);
          console.log('Route data:', data);
          console.log('Is authenticated:', this.isAuthenticated);
          console.log('Hide sidebar:', this.hideSidebar);
          console.log('Sidebar should be visible:', this.isAuthenticated && !this.hideSidebar);
        });
      });
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

  get localStorage() {
    return localStorage;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
  }
}
