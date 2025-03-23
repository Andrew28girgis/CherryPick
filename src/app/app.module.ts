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
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { LandingComponent } from './features/landing/landing.component';
import { SummeryComponent } from './features/summery/summery.component';
import { LogoutComponent } from './features/logout/logout.component';
import { TermsComponent } from './features/terms/terms.component';
import { NumberWithCommasPipe } from './shared/pipes/number-with-commas.pipe';
import { NgxSpinnerModule } from 'ngx-spinner';
import {
  NgbModule,
  NgbTooltipModule,
  NgbAlertModule,
  NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ToastrModule } from 'ngx-toastr';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { SharedModule } from './shared/shared.module';
import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
} from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { NgxFileDropModule } from 'ngx-file-drop';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TooltipModule } from 'primeng/tooltip';
import { AddTenantsComponent } from './features/add-tenants/add-tenants.component';
import { EmilyUserInboxComponent } from './features/emily-user-inbox/emily-user-inbox.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { ManagePropertiesComponent } from './features/landlord/manage-properties/manage-properties.component';
import { KanbanComponent } from './features/kanban/kanban.component';
import { KayakModule } from './features/kayak-home/kayak.module';

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
    AddTenantsComponent,
    EmilyUserInboxComponent
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
    ToastrModule.forRoot(),
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    KayakModule,
    SharedModule,
    ScrollingModule,
    NgxFileDropModule,
    TooltipModule,
    ButtonModule,
    StepperModule,
    NgbNavModule,
    SelectButtonModule,
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
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
