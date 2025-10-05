import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from './shared/components/login/login.component';
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
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { UploadOMComponent } from './features/kayak-home/shopping-center-table/uploadOM/uploadOM.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { LandingComponent } from './features/tenants/market-survery/landing/landing.component';
import { EditorModule } from 'primeng/editor';
import { AiChatingComponent } from './shared/components/ai-chating/ai-chating.component';
import { AiUiHTMLComponent } from './shared/components/ai-ui-HTML/ai-ui-HTML.component';
import { Landing2Component } from './features/tenants/market-survery/landing2/landing2.component';
import { Tree2Component } from './features/tree2/tree2.component';
import { FFlowModule, FConnectionContent } from '@foblex/flow';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LogoutComponent,
    TermsComponent,
    NumberWithCommasPipe,
    UploadOMComponent,
    SidebarComponent,
    LandingComponent,
    AiChatingComponent,
    AiUiHTMLComponent,
    Landing2Component,
    Tree2Component,
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
    SharedModule,
    ScrollingModule,
    NgxFileDropModule,
    TooltipModule,
    ButtonModule,
    StepperModule,
    NgbNavModule,
    SelectButtonModule,
    EditorModule,
    NotificationsComponent,
    FFlowModule,
    FConnectionContent,
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
