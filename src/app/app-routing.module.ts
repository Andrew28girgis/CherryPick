import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LandingComponent } from './components/landing/landing.component';
import { SummeryComponent } from './components/summery/summery.component';
import { UserBuyboxComponent } from './components/user-buybox/user-buybox.component';
import { AuthGuardService } from './services/auth-guard.service';
import { OrganizationDetailsComponent } from './components/organizations/organization-details/organization-details.component';
import { CherryExpansionComponent } from './components/cherry-expansion/cherry-expansion.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { DetailsComponent } from './components/kanban/details/details.component';
import { StakeHolderComponent } from './components/kanban/stake-holders/stake-holders.component';
import { TasksComponent } from './components/kanban/tasks/tasks.component';
import { ArchiveComponent } from './components/kanban/archive/archive.component';
import { AssistantComponent } from './components/kanban/assistant/assistant.component';
import { SourcesComponent } from './components/kanban/sources/sources.component';
import { PropertiesComponent } from './components/kanban/properties/properties.component';
import { PropertiesspilitviewComponent } from './components/kanban/properties/widgets/propertiesspilitview/propertiesspilitview.component';
import { PropertiesgridviewComponentComponent } from './components/kanban/properties/widgets/propertiesgridview-component/propertiesgridview-component.component';
import { KayakComponent } from './components/Kayak/kayak/kayak.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'BuyboxType',
    component: UserBuyboxComponent,
    canActivate: [AuthGuardService],
  },
  { path: 'summary', component: SummeryComponent },
  { path: 'summary/:orgId', component: SummeryComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
  {
    path: 'home/:buyboxid/:orgId',
    component: HomeComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'home/:contactId/:buyboxid/:city/:State/:MatchStatus',
    component: HomeComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'landing/:id/:shoppiongCenterId/:buyboxid',
    component: LandingComponent,
  },
  { path: 'organizationDetails/:id', component: OrganizationDetailsComponent },
  { path: 'CherryPickExpansion', component: CherryExpansionComponent },
  {
    path: 'Kanban',
    component: KanbanComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'Done',
    component: DetailsComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'stake-holders',
    component: StakeHolderComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'archive',
    component: ArchiveComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'assistant',
    component: AssistantComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'Sources',
    component: SourcesComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'Properties',
    component: PropertiesComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'PropertiesSpilit',
    component: PropertiesspilitviewComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'PropertiesGrid',
    component: PropertiesgridviewComponentComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'Kayak',
    component: KayakComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})

export class AppRoutingModule {}
