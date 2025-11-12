import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isMarketSurveyRoute = false;
  isChatbotRoute = false;
  isEmilyChatBot = false;
  hideSidebar = false;
  showingTransition = false;
  overlayActive = false; 
  campaignId: any; 

  constructor(
    private placeService: PlacesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeApiMode();
  }

  private initializeApiMode(): void {
    const apiMode = localStorage.getItem('apiMode');
    if (apiMode && JSON.parse(apiMode)) {
      this.placeService.setAppMode('api');
    }
  } 

  get isAuthenticated(): boolean {
    return this.authService.isLoggedInToday();
  }

}
