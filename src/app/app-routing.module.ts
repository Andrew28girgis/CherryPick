import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
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
import { EmailMulipleNewComponent } from './features/emily/email-muliple-new/email-muliple-new.component';
import { MailsGenerateOrSendComponent } from './features/emily/mails-generate-or-send/mails-generate-or-send.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { EmilyContactEmailComponent } from './features/emily/inbox/emily-contact-email.component';


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
  },
  {
    path: 'market-survey/:buyboxid/:orgId/:buyboxName',
    component: MarketSurveyComponent,
    canActivate: [TenantOnlyGuard],
    // canActivate: [AuthGuardService],
  },
  {
    path: 'home/:buyboxid/:orgId/:buyboxName',
    component: HomeComponent,
    canActivate: [TenantOnlyGuard],
  },
  // {
  //   // path: 'tenant/:buyboxid',
  //   path: 'tenant/:buyboxid/:campaignId',
  //   component: TenantComponent,
  //   canActivate: [TenantOnlyGuard],
  // },

  {
    path: ':guid',
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
    path: 'MutipleEmail/:campaignId',
    component: EmailMulipleNewComponent,
    canActivate: [TenantOnlyGuard],
  },
  // {
  //   path: 'MutipleEmail',
  //   component: EmailMulipleNewComponent,
  //   canActivate: [TenantOnlyGuard],
  // },
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
  { path: 'organization-mail/:buyBoxId/:organizationId/:campaignId', component: EmilyContactEmailComponent },

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
