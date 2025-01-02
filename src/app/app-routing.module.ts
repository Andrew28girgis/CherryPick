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
import { KayakComponent } from './components/Kayak/kayak/kayak.component';

const routes: Routes = [
  { path: '', component: LoginComponent},
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
    path: 'home/:buyboxid',
    component: HomeComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'home/:contactId/:buyboxid/:city/:State/:MatchStatus',
    component: HomeComponent,
    canActivate: [AuthGuardService],
  },
  { path: 'landing/:id/:shoppiongCenterId/:buyboxid', component: LandingComponent },
  { path: 'organizationDetails/:id', component: OrganizationDetailsComponent },
  { path: 'CherryPickExpansion', component: CherryExpansionComponent },
  { path: 'Kanban', component: KanbanComponent },
  { path: 'kayak', component: KayakComponent },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled' 
    })
  ],  exports: [RouterModule],
})
export class AppRoutingModule {}
