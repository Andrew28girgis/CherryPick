import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  APP_INITIALIZER,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components & Directives
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LandingComponent } from './components/landing/landing.component';
import { SummeryComponent } from './components/summery/summery.component';
import { KanbanComponent } from './components/kanban/kanban.component'; 
import { LogoutComponent } from './components/logout/logout.component';
import { TermsComponent } from './components/terms/terms.component'; 
import { NumberWithCommasPipe } from './shared/pipes/number-with-commas.pipe';

// Third-Party Modules
import { NgxSpinnerModule } from 'ngx-spinner';
import {
  NgbModule,
  NgbTooltipModule,
  NgbAlertModule,
} from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ToastrModule } from 'ngx-toastr';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Custom Modules & Interceptors
import { KayakModule } from './components/kayak-home/kayak.module';
import { SharedModule } from './shared/shared.module';
import { TokenInterceptor } from './token.interceptor';
 
// MSAL Imports
import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
} from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { ManagePropertiesComponent } from './components/manage-properties/manage-properties.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TooltipModule } from 'primeng/tooltip';

const msalConfig = {
  auth: {
    clientId: '32cd04af-9526-4567-8c83-23b3deb6a209', // Replace with your Azure AD Client ID
    authority: 'https://login.microsoftonline.com/common', // Replace with your Tenant ID if needed
    redirectUri: 'https://cp.cherrypick.com/summary', // Must match your Azure AD redirect URI
  },
  cache: {
    cacheLocation: 'sessionStorage', // or 'sessionStorage'
    storeAuthStateInCookie: false,
  },
};

export function initializeMsal(msalService: MsalService) {
  return () => msalService.instance.initialize();
}

const loginRequest = {
  scopes: [
    'User.Read',
    'offline_access',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
  ],
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    LandingComponent,
    SummeryComponent,
    KanbanComponent, 
    LogoutComponent,
    TermsComponent, 
    NumberWithCommasPipe,
    ManagePropertiesComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    NgbModule,
    NgbTooltipModule,
    NgbAlertModule,
    DragDropModule,
    ToastrModule.forRoot(), // Configuration for toastr can be added here if needed
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    KayakModule,
    SharedModule,
    ScrollingModule,
    NgxFileDropModule,
    TooltipModule,
    MsalModule.forRoot(
      new PublicClientApplication(msalConfig),
      {
        interactionType: InteractionType.Redirect,
        authRequest: loginRequest,
      },
      {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['User.Read']],
          ['https://graph.microsoft.com/v1.0/me/sendMail', ['Mail.Send']],
        ]),
      }
    ),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      deps: [MsalService],
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
