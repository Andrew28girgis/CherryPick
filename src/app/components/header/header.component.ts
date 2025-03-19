import { Component, ViewChild,  TemplateRef,  OnInit,  OnDestroy } from "@angular/core"
import {  Router, NavigationEnd,  Event as RouterEvent } from "@angular/router"
import  { SidbarService } from "src/app/shared/services/sidbar.service"
import  { Subscription } from "rxjs"
import { filter } from "rxjs/operators"

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isCollapsed = true
  notifications: any[] = [
    { id: 1, message: "New notification 1", time: "5 min ago" },
    { id: 2, message: "New notification 2", time: "1 hour ago" },
    { id: 3, message: "New notification 3", time: "2 hours ago" },
  ]

  emails: any[] = [
    {
      id: 1,
      subject: "Upcoming meeting",
      from: "john@example.com",
      time: "10:00 AM",
    },
    {
      id: 2,
      subject: "Project update",
      from: "sarah@example.com",
      time: "11:30 AM",
    },
    {
      id: 3,
      subject: "Weekly report",
      from: "mike@example.com",
      time: "2:00 PM",
    },
  ]

  // Avatar and view switching properties
  userAvatar: string | null = null
  currentView: "tenant" | "landlord" = "tenant"
  tenantRoute = "/summary"
  landlordRoute = "/landlord"
  private routerSubscription: Subscription | null = null

  @ViewChild("emailContent") emailContent!: TemplateRef<any>
  @ViewChild("notificationContent") notificationContent!: TemplateRef<any>

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state
    })
  }

  ngOnInit(): void {
    // Subscribe to router events to detect route changes
    this.routerSubscription = this.router.events
      .pipe(filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentView(event.url)
      })

    // Set initial view based on current URL
    this.updateCurrentView(this.router.url)

    // Fetch user avatar (or other data) from backend if needed
    this.fetchUserAvatar()
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe()
    }
  }

  updateCurrentView(url: string): void {
    // Check if the URL contains '/landlord'
    if (url.includes("/landlord")) {
      this.currentView = "landlord"
    } else {
      this.currentView = "tenant"
    }

  }

  fetchUserAvatar(): void {
    // This is a placeholder for the actual API call to get user avatar
    // In a real application, you would call your backend service here

    // Simulate getting avatar from backend
    setTimeout(() => {
      this.userAvatar = "" // Replace with actual avatar URL
    }, 500)
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar()
  }

  logout(): void {
    localStorage.removeItem("token")
    this.router.navigate(["/login"])
  }

  BackTo() {
    this.router.navigate(["/dashboard"])
  }

  isNavbarOpen = false

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen
  }
}

