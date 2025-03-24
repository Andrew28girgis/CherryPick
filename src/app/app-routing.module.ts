import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LandingComponent } from './features/market-survey/landing/landing.component';
import { SummeryComponent } from './features/summery/summery.component';
import { TermsComponent } from './features/terms/terms.component';
import { TenantComponent } from './features/tenant/tenant.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AddTenantsComponent } from './features/add-tenants/add-tenants.component';
import { LandlordAccessGuard } from './core/guards/landlord-access.guard';
import { TenantOnlyGuard } from './core/guards/tenant-only.guard';
import { EmilyUserInboxComponent } from './features/emily-user-inbox/emily-user-inbox.component';
import { SubmissionsComponent } from './features/Submissions/logs.component';
import { AuthGuardService } from './core/services/auth-guard.service';
import { KanbanComponent } from './features/kanban/kanban.component';
import { HomeComponent } from './features/market-survey/home/home.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'tos', component: TermsComponent },
  {
    path: 'landing/:id/:shoppiongCenterId/:buyboxid',
    component: LandingComponent,
  },
  {
    path: 'landlord',
    loadChildren: () =>
      import('./features/landlord/landlord.module').then(
        (m) => m.LandlordModule
      ),
    canActivate: [LandlordAccessGuard],
  },
  {
    path: 'summary',
    component: SummeryComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'Submissions',
    component: SubmissionsComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'add-tenant',
    component: AddTenantsComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'summary/:orgId',
    component: SummeryComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'home/:buyboxid/:orgId/:buyboxName',
    component: HomeComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'tenant/:buyboxid',
    component: TenantComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'Kanban',
    component: KanbanComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'Kanban/:id',
    component: KanbanComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'EmilyUserInbox',
    component: EmilyUserInboxComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'tenantWithPolygons',
    component: AddTenantsComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'dashboard/:buyboxid/:orgId/:buyboxName',
    loadChildren: () =>
      import('./features/kayak-home/kayak.module').then((m) => m.KayakModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
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
