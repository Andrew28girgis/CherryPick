import { NgModule } from "@angular/core"
import { RouterModule, type Routes } from "@angular/router"
import { LoginComponent } from "./components/login/login.component"
import { HomeComponent } from "./components/home/home.component"
import { LandingComponent } from "./components/landing/landing.component"
import { SummeryComponent } from "./components/summery/summery.component"
import { AuthGuardService } from "./shared/services/auth-guard.service"
import { KanbanComponent } from "./components/kanban/kanban.component"
import { TermsComponent } from "./components/terms/terms.component"
import { TenantComponent } from "./components/tenant/tenant.component"
import { DashboardComponent } from "./components/dashboard/dashboard.component"
import { AddTenantsComponent } from "./components/add-tenants/add-tenants.component"

// Import the route guards
import { LandlordAccessGuard } from "./shared/guards/landlord-access.guard"
import { TenantOnlyGuard } from "./shared/guards/tenant-only.guard"
import { EmilyUserInboxComponent } from "./components/emily-user-inbox/emily-user-inbox.component"

const routes: Routes = [
  // Public routes - accessible to everyone
  { path: "", component: LoginComponent },
  { path: "login", component: LoginComponent },
  { path: "tos", component: TermsComponent },

  // Landing page - typically public but can be protected if needed
  { path: "landing/:id/:shoppiongCenterId/:buyboxid", component: LandingComponent },

  // Landlord routes - only accessible by landlord users
  {
    path: "landlord",
    loadChildren: () => import("./components/landlord/landlord.module").then((m) => m.LandlordModule),
    canActivate: [LandlordAccessGuard],
  },

  // Tenant routes - only accessible by tenant users (or blocked for landlord users)
  {
    path: "",
    canActivate: [TenantOnlyGuard],
    children: [
      { path: "summary", component: SummeryComponent },
      { path: "add-tenant", component: AddTenantsComponent },
      { path: "summary/:orgId", component: SummeryComponent },
      {
        path: "home",
        component: HomeComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: "home/:buyboxid/:orgId/:buyboxName",
        component: HomeComponent,
        // canActivate: [AuthGuardService],
      },
      {
        path: "tenant/:buyboxid",
        component: TenantComponent,
        // canActivate: [AuthGuardService],
      },
      {
        path: "Kanban",
        component: KanbanComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: "Kanban/:id",
        component: KanbanComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: "dashboard",
        component: DashboardComponent,
      },
      {
        path: "tenantWithPolygons",
        component: AddTenantsComponent,
      },
      {
        path: "EmilyUserInbox",
        component: EmilyUserInboxComponent,
      },
      {
        path: "dashboard/:buyboxid/:orgId/:buyboxName",
        loadChildren: () => import("./components/kayak-home/kayak.module").then((m) => m.KayakModule),
        canActivate: [AuthGuardService],
      },
    ],
  },

  // Wildcard route - redirect based on user view
  {
    path: "**",
    redirectTo: "",
    pathMatch: "full",
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: "enabled",
      anchorScrolling: "enabled",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

