import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NgxSliderModule } from 'ngx-slider-v2';
import { LandingComponent } from './components/landing/landing.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NumberFormatDirective } from './app-number-format.directive';
import { NumberWithCommasPipe } from './pipes/number-with-commas.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { TokenInterceptor } from './token.interceptor';
import { StartingComponent } from './components/starting/starting.component';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { SummeryComponent } from './components/summery/summery.component';
import { UserBuyboxComponent } from './components/user-buybox/user-buybox.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { OrganizationsComponent } from './components/organizations/organizations.component';
import { OrganizationDetailsComponent } from './components/organizations/organization-details/organization-details.component';
import { CherryExpansionComponent } from './components/cherry-expansion/cherry-expansion.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { KanbanHomeComponent } from './components/kanban/kanban-home/kanban-home.component';
import { SidebarComponent } from './components/kanban/sidebar/sidebar.component'; 
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NavbarComponent,
    NumberFormatDirective,
    LandingComponent,
    NumberWithCommasPipe,
    StartingComponent,
    SummeryComponent,
    UserBuyboxComponent,
    OrganizationsComponent,
    OrganizationDetailsComponent,
    CherryExpansionComponent,
    KanbanComponent,
    KanbanHomeComponent,
    SidebarComponent, 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    NgxSliderModule,
    NgxSpinnerModule,
    NgbModule,
    NgbTooltipModule,
    NgbAlertModule,
    ShareButtonsModule.withConfig({
      debug: true,
    }),
    ShareIconsModule,
    NgxPaginationModule,
    DragDropModule,
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
