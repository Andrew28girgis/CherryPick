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
  isMobile = false;
  isSocialView: boolean = false;
  hideSidebar = false;
  isNotificationsOpen = false; // Add this property to your class

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
          this.hideSidebar = data['hideSidebar'] === true;
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
