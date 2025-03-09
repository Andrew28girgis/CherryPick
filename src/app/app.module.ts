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
import { NavbarComponent } from './components/navbar/navbar.component';
import { LandingComponent } from './components/landing/landing.component';
import { SummeryComponent } from './components/summery/summery.component';
import { CherryExpansionComponent } from './components/cherry-expansion/cherry-expansion.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { KanbanHomeComponent } from './components/kanban/kanban-home/kanban-home.component';
import { SidebarComponent } from './components/kanban/sidebar/sidebar.component';
import { FilterPanelComponent } from './components/kanban/filter-panel/filter-panel.component';
import { EditPopupComponent } from './components/kanban/details/edit-popup/edit-popup.component';
import { DetailsComponent } from './components/kanban/details/details.component';
import { PropertiesComponent } from './components/kanban/properties/properties.component';
import { PropertiesgridviewComponentComponent } from './components/kanban/properties/widgets/propertiesgridview-component/propertiesgridview-component.component';
import { PropertiesspilitviewComponent } from './components/kanban/properties/widgets/propertiesspilitview/propertiesspilitview.component';
import { AddSourceModalComponent } from './components/kanban/sources/add-source-modal/add-source-modal.component';
import { StakeHolderComponent } from './components/kanban/stake-holders/stake-holders.component';
import { SourcesComponent } from './components/kanban/sources/sources.component';
import { TasksComponent } from './components/kanban/tasks/tasks.component';
import { CommunicationComponent } from './components/kanban/communication/communication.component';
import { LogoutComponent } from './components/logout/logout.component';
import { TermsComponent } from './components/terms/terms.component';
import { NumberFormatDirective } from './app-number-format.directive';
import { NumberWithCommasPipe } from './pipes/number-with-commas.pipe';

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
import { GroqApiInterceptor } from './groq-api-interceptor.interceptor';

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
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

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
    NavbarComponent,
    LandingComponent,
    SummeryComponent,
    CherryExpansionComponent,
    KanbanComponent,
    KanbanHomeComponent,
    SidebarComponent,
    FilterPanelComponent,
    EditPopupComponent,
    DetailsComponent,
    PropertiesComponent,
    PropertiesgridviewComponentComponent,
    PropertiesspilitviewComponent,
    AddSourceModalComponent,
    StakeHolderComponent,
    SourcesComponent,
    TasksComponent,
    CommunicationComponent,
    LogoutComponent,
    TermsComponent,
    NumberFormatDirective,
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GroqApiInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
