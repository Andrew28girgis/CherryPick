import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isMarketSurveyRoute = false;
  display: boolean = false;
  isMobile = false;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  isSocialView: boolean = false;

  ngOnInit() {
    this.checkScreenSize();
    this.isSocialView =
      this.localStorage.getItem('currentViewDashBord') === '5';

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data: any) => {
        this.display = !data.hideHeader;
      });
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
    // On mobile, always use the responsive card view
  }
}
