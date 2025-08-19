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
import { MailsGenerateOrSendComponent } from './features/emily/mails-generate-or-send/mails-generate-or-send.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { NewMulipleEmailComponent } from './features/emily/new-muliple-email/new-muliple-email.component';
import { InboxComponent } from './features/emily/inbox/inbox.component';
import { CanvasHomeComponent } from './features/canvas/canvas-home/canvas-home.component';
import { DataSourcesComponent } from './features/data-sources/data-sources.component';
import { ContactsComponent } from './features/contacts/contacts.component';
import { ShoppingComponent } from './features/shopping/shopping.component';
import { AccountLinkedGuard } from './core/guards/account-linked.guard';
import { ExtractShoppingCenterComponent } from './features/extract-shopping-center/extract-shopping-center.component';
import { EmailInfoComponent } from './features/email-info/email-info.component';
import { MarketSurveyComponent } from './features/tenants/market-survery/market-survey-home/market-survey.component';
import { AiSpinnerComponent } from './shared/components/ai-spinner/ai-spinner.component';
import { AiFailedComponent } from './shared/components/ai-failed/ai-failed.component';
import { AutomationComponent } from './shared/components/automation/automation.component';
import { AutomationShoppingCentersComponent } from './shared/components/automation-shopping-centers/automation-shopping-centers.component';
import { UploadOMComponent } from './features/kayak-home/shopping-center-table/uploadOM/uploadOM.component';
import { AiChatingComponent } from './shared/components/ai-chating/ai-chating.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
    data: { hideHeader: true },
  },
  { path: 'login', component: LoginComponent, data: { hideHeader: true } },
  {
    path: 'accounts-link',
    loadChildren: () =>
      import('./features/settings/settings.module').then(
        (m) => m.SettingsModule
      ),
    data: { hideHeader: true },
    canActivate: [AuthGuardService],
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.module').then(
        (m) => m.SettingsModule
      ),
    canActivate: [AuthGuardService],
  },
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
    path: 'landing/:id/:shoppiongCenterId/:campaignId',
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
    path: 'market-survey',
    component: MarketSurveyComponent,
    data: { hideHeader: true },
  },
  {
    path: 'ai-chating',
    component: AiChatingComponent,
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
    path: 'organization-mail/:organizationId/:campaignId',
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
    path: 'spinner',
    component: AiSpinnerComponent,
    data: { hideHeader: true , hideSidebar: true},
  },
  {
    path: 'aiFailed',
    component: AiFailedComponent,
    data: { hideHeader: true , hideSidebar: true },
  },
  {
    path: 'automation/:automationId',
    component: AutomationComponent,
    data: { hideHeader: true, hideSidebar: true }, // Add hideSidebar: true here
  },
  {
    path: 'automationCenters/:automationId',
    component: AutomationShoppingCentersComponent,
    data: { hideHeader: true, hideSidebar: true }, // Add hideSidebar: true here
  },
  {
    path: 'dashboard/:orgId/:orgName/:campaignId',
    loadChildren: () =>
      import('./features/kayak-home/kayak.module').then((m) => m.KayakModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'emailInfo/:mailId',
    component: EmailInfoComponent,
  },
  {
    path: ':uploadOM/:submissionId',
    component: UploadOMComponent,
    // data: { hideHeader: true },
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
