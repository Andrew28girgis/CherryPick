import { NgModule } from '@angular/core';
import { RouterModule, type Routes, PreloadAllModules } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { ResetPasswordComponent } from './shared/components/change-password/change-password.component';
import { ForgetPasswordComponent } from './shared/components/forget-password/forget-password.component';
import { NewPasswordComponent } from './shared/components/new-password/new-password.component';
import { LandingComponent } from './features/tenants/market-survery/landing/landing.component';
import { TermsComponent } from './shared/components/terms/terms.component';
import { TenantComponent } from './features/tenants/tenant/tenant.component';
import { LandlordAccessGuard } from './core/guards/landlord-access.guard';
import { TenantOnlyGuard } from './core/guards/tenant-only.guard';
import { AuthGuardService } from './core/services/auth-guard.service';
import { AccountLinkedGuard } from './core/guards/account-linked.guard';
import { AiSpinnerComponent } from './shared/components/ai-spinner/ai-spinner.component';
import { AiFailedComponent } from './shared/components/ai-failed/ai-failed.component';
import { AutomationComponent } from './shared/components/automation/automation.component';
import { AutomationShoppingCentersComponent } from './shared/components/automation-shopping-centers/automation-shopping-centers.component';
import { UploadOMComponent } from './features/kayak-home/shopping-center-table/uploadOM/uploadOM.component';
import { AiChatingComponent } from './shared/components/ai-chating/ai-chating.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { AiUiHTMLComponent } from './shared/components/ai-ui-HTML/ai-ui-HTML.component';
import { UserPagesComponent } from './features/user-pages/user-pages.component';
import { ContactsComponent } from './features/contacts/contacts.component';

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
  {
    path: 'organizations',
    loadChildren: () =>
      import('./features/organizations/organizations.module').then(
        (m) => m.OrganizationsModule
      ),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
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
    loadChildren: () =>
      import('./features/summery/summery.module').then((m) => m.SummeryModule),
    canActivate: [AuthGuardService],
  },
  {
    path: 'canvas',
    loadChildren: () =>
      import('./features/canvas/canvas.module').then((m) => m.CanvasModule),
    canActivate: [AuthGuardService],
  },
  {
    path: 'overview',
    loadChildren: () =>
      import('./features/tasks/tasks.module').then((m) => m.TasksModule),
    canActivate: [TenantOnlyGuard, AccountLinkedGuard],
  },
  {
    path: 'data-sources',
    loadChildren: () =>
      import('./features/data-sources/data-sources.module').then(
        (m) => m.DataSourcesModule
      ),
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'submissions/:campaignId',
    loadChildren: () =>
      import('./features/Submissions/submissions.module').then(
        (m) => m.SubmissionsModule
      ),
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
    path: 'user-pages',
    component: UserPagesComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'add-tenant',
    loadChildren: () =>
      import('./features/tenants/add-tenants/add-tenants.module').then(
        (m) => m.AddTenantsModule
      ),
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'summary/:orgId',
    loadChildren: () =>
      import('./features/summery/summery.module').then((m) => m.SummeryModule),
    canActivate: [TenantOnlyGuard],
  },

  {
    path: 'market-survey',
    loadChildren: () =>
      import('./features/tenants/market-survery/market-survey.module').then(
        (m) => m.MarketSurveyModule
      ),
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
    loadChildren: () =>
      import('./features/kanban/kanban.module').then((m) => m.KanbanModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'MutipleEmail/:campaignId',
    loadChildren: () =>
      import('./features/emily/emily.module').then((m) => m.EmilyModule),
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'MailsList/:MailContextId/:IsSent',
    loadChildren: () =>
      import('./features/emily/emily.module').then((m) => m.EmilyModule),
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'tenantWithPolygons',
    loadChildren: () =>
      import('./features/tenants/add-tenants/add-tenants.module').then(
        (m) => m.AddTenantsModule
      ),
    canActivate: [TenantOnlyGuard],
  },
  {
    path: 'organization-mail/:organizationId/:campaignId',
    loadChildren: () =>
      import('./features/emily/emily.module').then((m) => m.EmilyModule),
    canActivate: [AuthGuardService],
  },
  {
    path: 'shoppingcenters',
    loadChildren: () =>
      import('./features/shopping/shopping.module').then(
        (m) => m.ShoppingModule
      ),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'extractShopping/:id',
    loadChildren: () =>
      import(
        './features/extract-shopping-center/extract-shopping-center.module'
      ).then((m) => m.ExtractShoppingCenterModule),
  },
  {
    path: 'spinner',
    component: AiSpinnerComponent,
    data: { hideHeader: true, hideSidebar: true },
  },
  {
    path: 'aiFailed',
    component: AiFailedComponent,
    data: { hideHeader: true, hideSidebar: true },
  },
  {
    path: 'automation/:automationId',
    component: AutomationComponent,
    data: { hideHeader: true, hideSidebar: true },
  },
  {
    path: 'automationCenters/:automationId',
    component: AutomationShoppingCentersComponent,
    data: { hideHeader: true, hideSidebar: true },
  },
  {
    path: 'dashboard/:orgId/:orgName/:campaignId',
    loadChildren: () =>
      import('./features/kayak-home/kayak.module').then((m) => m.KayakModule),
    canActivate: [AuthGuardService, TenantOnlyGuard],
  },
  {
    path: 'emailInfo/:mailId',
    loadChildren: () =>
      import('./features/email-info/email-info.module').then(
        (m) => m.EmailInfoModule
      ),
  },
  {
    path: 'contacts',
    component: ContactsComponent,
  },
  {
    path: 'ai-ui-HTML/:notificationId',
    component: AiUiHTMLComponent,
  },
 
  {
    path: ':uploadOM/:submissionId',
    component: UploadOMComponent,
  },
  {
    path: 'chatbot',
    component: NotificationsComponent,
  },
  { path: 'emily-chatsbot', component: NotificationsComponent },

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
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
