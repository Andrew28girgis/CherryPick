import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components & Directives
import { AppComponent } from './app.component';
import { LoginComponent } from './shared/components/login/login.component';
import { LandingComponent } from './features/tenants/market-survery/landing/landing.component';
import { SummeryComponent } from './features/summery/summery.component';
import { LogoutComponent } from './shared/components/logout/logout.component';
import { TermsComponent } from './shared/components/terms/terms.component';
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
import { NgxFileDropModule } from 'ngx-file-drop';
import { TooltipModule } from 'primeng/tooltip';
import { AddTenantsComponent } from './features/tenants/add-tenants/add-tenants.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { ManagePropertiesComponent } from './features/landlord/manage-properties/manage-properties.component';
import { KanbanComponent } from './features/kanban/kanban.component';
import { KayakModule } from './features/kayak-home/kayak.module';
import { HomeComponent } from './features/tenants/market-survery/home/home.component';
import { MarketSurveyComponent } from './features/tenants/market-survery/market-survey-home/market-survey.component';
import { MarketTableViewComponent } from './features/tenants/market-survery/market-table-view/market-table-view.component';
import { SocialMediaViewComponent } from './features/tenants/market-survery/market-social-view/social-media-view.component';
import { MarketSideViewComponent } from './features/tenants/market-survery/market-side-view/market-side-view.component';
import { MarketMapViewComponent } from './features/tenants/market-survery/market-map-view/market-map-view.component';
import { MarketCardViewComponent } from './features/tenants/market-survery/market-card-view/market-card-view.component';
import { MailsGenerateOrSendComponent } from './features/emily/mails-generate-or-send/mails-generate-or-send.component';
import { BreadcrumbComponent } from './shared/components/breadcrumb/breadcrumb.component';
import { InboxComponent } from './features/emily/inbox/inbox.component';
import { EditorModule } from 'primeng/editor';
import { NewMulipleEmailComponent } from './features/emily/new-muliple-email/new-muliple-email.component';
import { CampaignModule } from './features/campaign/campaign.module';
import { EmailInboxComponent } from './features/emily/email-inbox/email-inbox.component';

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
    AddTenantsComponent,
    MarketSurveyComponent,
    MarketTableViewComponent,
    SocialMediaViewComponent,
    MarketSideViewComponent,
    MarketMapViewComponent,
    MarketCardViewComponent,
    MailsGenerateOrSendComponent,
    BreadcrumbComponent,
    InboxComponent,
    NewMulipleEmailComponent,
    EmailInboxComponent,
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
    EditorModule,
    CampaignModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
