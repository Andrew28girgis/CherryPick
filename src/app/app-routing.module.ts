import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { LandingComponent } from './features/landing/landing.component';
import { SummeryComponent } from './features/summery/summery.component';
 import { KanbanComponent } from './components/kanban/kanban.component';
import { TermsComponent } from './features/terms/terms.component';
import { TenantComponent } from './features/tenant/tenant.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AddTenantsComponent } from './features/add-tenants/add-tenants.component';
// Import the route guards
import { LandlordAccessGuard } from './core/guards/landlord-access.guard';
import { TenantOnlyGuard } from './core/guards/tenant-only.guard';
import { EmilyUserInboxComponent } from './features/emily-user-inbox/emily-user-inbox.component';
import { SubmissionsComponent } from './features/Submissions/logs.component';
import { AuthService } from './core/services/auth.service';
import { AuthGuardService } from './core/services/auth-guard.service';

const routes: Routes = [
  // Public routes - accessible to everyone
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'tos', component: TermsComponent },

  // Landing page - typically public but can be protected if needed
  {
    path: 'landing/:id/:shoppiongCenterId/:buyboxid',
    component: LandingComponent,
  },

  // Landlord routes - only accessible by landlord users
  {
    path: 'landlord',
    loadChildren: () =>
      import('./components/landlord/landlord.module').then(
        (m) => m.LandlordModule
      ),
    canActivate: [LandlordAccessGuard],
  },

  // Tenant routes - only accessible by tenant users (or blocked for landlord users)
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
    // canActivate: [AuthGuardService],
  },
  {
    path: 'tenant/:buyboxid',
    component: TenantComponent,
    canActivate: [TenantOnlyGuard],
    // canActivate: [AuthGuardService],
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
      import('./components/kayak-home/kayak.module').then((m) => m.KayakModule),
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
