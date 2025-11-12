import { Component, OnInit } from '@angular/core';
import { PlacesService } from './core/services/places.service';
import { AuthService } from './core/services/auth.service';

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
  shouldShowSidebar = true;
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

  get appShellClasses(): { [key: string]: boolean } {
    return {
      'with-sidebar': this.shouldShowSidebar,
      'emily-chatbot': this.isEmilyChatBot,
      'chatbot-route': this.isChatbotRoute,
      authenticated: this.isAuthenticated,
      'overlay-active': this.overlayActive,
    };
  }

}
