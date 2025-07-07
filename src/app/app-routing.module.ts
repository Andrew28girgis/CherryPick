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
import { CanvasHomeComponent } from './features/canvas/canvas-home/canvas-home.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { RegisterationComponent } from './shared/components/registeration/registeration.component';
import { DataSourcesComponent } from './features/data-sources/data-sources.component';
import { ContactsComponent } from './features/contacts/contacts.component';
import { ShoppingComponent } from './features/shopping/shopping.component';
import { AccountLinkedGuard } from './core/guards/account-linked.guard';
import { ExtractShoppingCenterComponent } from './features/extract-shopping-center/extract-shopping-center.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
    data: { hideHeader: true },
  },
  { path: 'login', component: LoginComponent, data: { hideHeader: true } },
  // {
  //   path: 'registeration',
  //   component: RegisterationComponent,
  //   data: { hideHeader: true },
  // },

  {
    path: 'ResetPassword',
    component: ResetPasswordComponent,
    data: { hideHeader: true },
  },
  {
    path: 'ForgetPassword',
    component: ForgetPasswordComponent,
    data: { hideHeader: true },
  },
  {
    path: 'NewPassword',
    component: NewPasswordComponent,
    data: { hideHeader: true },
  },
  { path: 'tos', component: TermsComponent, data: { hideHeader: true } },
  {
    path: 'properties',
    loadChildren: () =>
      import('../app/features/properties/properties.module').then(
        (m) => m.PropertiesModule
      ),
    canActivate: [AuthGuardService],
  },
  // {
  //   path: 'organizations',
  //   loadChildren: () =>
  //     import('../app/features/organizations/organizations.module').then(
  //       (m) => m.OrganizationsModule
  //     ),
  //   canActivate: [AuthGuardService],
  // },
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
    canActivate: [AuthGuardService],
  },
  {
    path: 'canvas',
    component: CanvasHomeComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'overview',
    component: TasksComponent,
    canActivate: [TenantOnlyGuard, AccountLinkedGuard],
  },
  {
    path: 'data-sources',
    component: DataSourcesComponent,
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
    path: 'market-survey',
    component: MarketSurveyComponent,
    canActivate: [TenantOnlyGuard, AuthGuardService],
    data: { hideHeader: true },
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    data: { hideHeader: true },
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
    canActivate: [AuthGuardService],
  },
  {
    path: 'organizations',
    component: ContactsComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'shoppingcenters',
    component: ShoppingComponent,
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'extractShopping/:id',
    component: ExtractShoppingCenterComponent,
    // canActivate: [AuthGuardService, TenantOnlyGuard],
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
