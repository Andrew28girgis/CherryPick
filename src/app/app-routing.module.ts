import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { ResetPasswordComponent } from './shared/components/change-password/change-password.component';
import { ForgetPasswordComponent } from './shared/components/forget-password/forget-password.component';
import { NewPasswordComponent } from './shared/components/new-password/new-password.component';
import { LandingComponent } from './features/tenants/market-survery/landing/landing.component';
import { SummeryComponent } from './features/summery/summery.component';
import { TermsComponent } from './shared/components/terms/terms.component';
import { TenantComponent } from './features/tenants/tenant/tenant.component';
import { AddTenantsComponent } from './features/tenants/add-tenants/add-tenants.component';
import { LandlordAccessGuard } from './core/guards/landlord-access.guard';
import { TenantOnlyGuard } from './core/guards/tenant-only.guard';
import { SubmissionsComponent } from './features/Submissions/logs.component';
import { AuthGuardService } from './core/services/auth-guard.service';
import { KanbanComponent } from './features/kanban/kanban.component';
import { HomeComponent } from './features/tenants/market-survery/home/home.component';
import { MarketSurveyComponent } from './features/tenants/market-survery/market-survey-home/market-survey.component';
import { MailsGenerateOrSendComponent } from './features/emily/mails-generate-or-send/mails-generate-or-send.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { NewMulipleEmailComponent } from './features/emily/new-muliple-email/new-muliple-email.component';
import { InboxComponent } from './features/emily/inbox/inbox.component';

const routes: Routes = [
  { path: '', component: LoginComponent, data: { hideHeader: true } },
  { path: 'login', component: LoginComponent, data: { hideHeader: true } },
  { path: 'ResetPassword', component: ResetPasswordComponent, data: { hideHeader: true } },
  { path: 'ForgetPassword', component: ForgetPasswordComponent, data: { hideHeader: true } },
  { path: 'NewPassword', component: NewPasswordComponent, data: { hideHeader: true } },
  { path: 'tos', component: TermsComponent, data: { hideHeader: true } },
  {
    path: 'landing/:id/:shoppiongCenterId/:buyboxid',
    component: LandingComponent,
    data: { hideHeader: true },
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
    path: 'tasks',
    component: TasksComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'submissions/:campaignId',
    component: SubmissionsComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'campaigns',
    loadChildren: () =>
      import('./features/campaign/campaign.module').then(
        (m) => m.CampaignModule
      ),
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
    data: { hideHeader: true },
  },
  {
    path: 'market-survey/:buyboxid/:orgId/:buyboxName/:campaignId',
    component: MarketSurveyComponent,
    canActivate: [TenantOnlyGuard],
    data: { hideHeader: true },
    // canActivate: [AuthGuardService],
  },
  {
    path: 'home/:buyboxid/:orgId/:buyboxName',
    component: HomeComponent,
    canActivate: [TenantOnlyGuard],
    data: { hideHeader: true },
  },
  {
    path: 'Kanban',
    loadChildren: () =>
      import('./features/kanban/kanban.module').then((m) => m.KanbanModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },

  {
    path: 'Kanban/:id',
    component: KanbanComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'MutipleEmail/:campaignId',
    component: NewMulipleEmailComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'MailsList/:MailContextId/:IsSent',
    component: MailsGenerateOrSendComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'tenantWithPolygons',
    component: AddTenantsComponent,
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'organization-mail/:buyBoxId/:organizationId/:campaignId',
    component: InboxComponent,
  },
  {
    path: 'dashboard/:buyboxid/:orgId/:buyboxName/:campaignId',
    loadChildren: () =>
      import('./features/kayak-home/kayak.module').then((m) => m.KayakModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: ':guid',
    component: TenantComponent,
    data: { hideHeader: true },
  },
  {
    path: ':guid/:contactId',
    component: TenantComponent,
    data: { hideHeader: true },
  },
  {
    path: ':guid/:contactId/:userSubmission',
    component: TenantComponent,
    data: { hideHeader: true },
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
