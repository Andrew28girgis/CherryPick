import { NgModule, CUSTOM_ELEMENTS_SCHEMA, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LandingComponent } from './components/landing/landing.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NumberFormatDirective } from './app-number-format.directive';
import { NumberWithCommasPipe } from './pipes/number-with-commas.pipe';
import {
  NgbModule,
  NgbTooltipModule,
  NgbAlertModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TokenInterceptor } from './token.interceptor';
import { SummeryComponent } from './components/summery/summery.component';
import { CherryExpansionComponent } from './components/cherry-expansion/cherry-expansion.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { KanbanHomeComponent } from './components/kanban/kanban-home/kanban-home.component';
import { SidebarComponent } from './components/kanban/sidebar/sidebar.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KayakModule } from './components/kayak-home/kayak.module';
import { ToastrModule } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { GroqApiInterceptor } from './groq-api-interceptor.interceptor';
import { LogoutComponent } from './components/logout/logout.component';
import { SharedModule } from './shared/shared.module';
import { TermsComponent } from './components/terms/terms.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MsalModule, MsalService, MsalGuard, MsalBroadcastService } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
// Initialize MSAL before Angular loads
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '0405c49c-ebe8-4fef-9ae7-87305ad01f8e', // Replace with your Azure AD Client ID
    authority: 'https://login.microsoftonline.com/fdfd5c3f-1883-4d75-9dc4-dbbda9b8ce8d', // Replace with your Tenant ID
    redirectUri: 'http://localhost:4200/summary', // Must match your Azure AD redirect URI
  }
});

function initializeMsal() {
  return () => msalInstance.initialize();
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NavbarComponent,
    NumberFormatDirective,
    LandingComponent,
    NumberWithCommasPipe,
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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    NgbModule,
    NgbTooltipModule,
    NgbAlertModule,
    DragDropModule,
    ToastrModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    KayakModule,
    SharedModule,
    ScrollingModule,
    MsalModule.forRoot(
      msalInstance, 
      {
        interactionType: InteractionType.Redirect, 
        authRequest: {
          scopes: ['User.Read'],
        }
      },
      {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me/sendMail', ['https://graph.microsoft.com/Mail.Send']]
        ])
      }
    )
  ],
 
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      multi: true
    },
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
