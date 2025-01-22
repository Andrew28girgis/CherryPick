import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component'; 
import { LandingComponent } from './components/landing/landing.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NumberFormatDirective } from './app-number-format.directive';
import { NumberWithCommasPipe } from './pipes/number-with-commas.pipe';
import { NgbModule, NgbTooltipModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { TokenInterceptor } from './token.interceptor';
import { StartingComponent } from './components/starting/starting.component';
import { SummeryComponent } from './components/summery/summery.component';
import { UserBuyboxComponent } from './components/user-buybox/user-buybox.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { OrganizationsComponent } from './components/organizations/organizations.component';
import { OrganizationDetailsComponent } from './components/organizations/organization-details/organization-details.component';
import { CherryExpansionComponent } from './components/cherry-expansion/cherry-expansion.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { KanbanHomeComponent } from './components/kanban/kanban-home/kanban-home.component';
import { SidebarComponent } from './components/kanban/sidebar/sidebar.component'; 
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KayakComponent } from './components/Kayak/kayak/kayak.component';
import { SortByPipe } from './pipes/sortBy/sort-by.pipe';
import { ToastrModule } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { AssistantComponent } from './components/kanban/assistant/assistant.component';
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
import { KayakHomeComponent } from './components/kayak-home/kayak-home.component';
import { EmilyComponent } from './components/kayak-home/emily/emily.component';
import { BuyboxDetailsComponent } from './components/kayak-home/buybox-details/buybox-details.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { GroqApiInterceptor } from './groq-api-interceptor.interceptor';
import { ChatHttpClient } from './services/chat-http-client';
import { BuyboxShoppingCentersComponent } from './components/kayak-home/buybox-shopping-centers/buybox-shopping-centers.component';

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
    KayakComponent,
    SortByPipe,
    AssistantComponent,
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
    KayakHomeComponent,
    EmilyComponent,
    BuyboxDetailsComponent,
    BuyboxShoppingCentersComponent
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    NgbModule,
    NgbTooltipModule,
    NgbAlertModule,
    NgxPaginationModule,
    DragDropModule,
    ReactiveFormsModule, 
    ToastrModule.forRoot(),
    RouterModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    BrowserAnimationsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
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
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AppModule {}
