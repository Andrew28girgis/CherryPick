import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LandingComponent } from './components/landing/landing.component';
import { SummeryComponent } from './components/summery/summery.component';
import { AuthGuardService } from './shared/services/auth-guard.service';
import { KanbanComponent } from './components/kanban/kanban.component';
import { TermsComponent } from './components/terms/terms.component';
import { ManagePropertiesComponent } from './components/manage-properties/manage-properties.component';
import { TenantComponent } from './components/tenant/tenant.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddTenantsComponent } from './components/add-tenants/add-tenants.component';
import { TenantWithPolygonsComponent } from './components/tenant-with-polygons/tenant-with-polygons.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'summary', component: SummeryComponent },
  { path: 'manage-properties', component: ManagePropertiesComponent },
  { path: 'add-tenant', component: AddTenantsComponent },
  { path: 'summary/:orgId', component: SummeryComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
  {
    path: 'home/:buyboxid/:orgId/:buyboxName',
    component: HomeComponent,
    // canActivate: [AuthGuardService],
  },
  {
    path: 'tenant/:buyboxid',
    component: TenantComponent,
    // canActivate: [AuthGuardService],
  },
  {
    path: 'landing/:id/:shoppiongCenterId/:buyboxid',
    component: LandingComponent,
  },
  {
    path: 'Kanban',
    component: KanbanComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'Kanban/:id',
    component: KanbanComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'tos',
    component: TermsComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'tenantWithPolygons',
    component: AddTenantsComponent,
  },

  {
    path: 'dashboard/:buyboxid/:orgId/:buyboxName',
    loadChildren: () =>
      import('./components/kayak-home/kayak.module').then((m) => m.KayakModule),
    canActivate: [AuthGuardService],
  },
  { path: 'landlord', loadChildren: () =>
    import('./components/landlord/landlord.module').then(m => m.LandlordModule) },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}