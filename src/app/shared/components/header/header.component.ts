import {
  Component,
   OnInit,
   OnDestroy,
  ViewChild,
   TemplateRef,
  HostListener,
   ElementRef,
} from "@angular/core"
import {  Router, NavigationEnd,  Event as RouterEvent } from "@angular/router"
import  { Subscription } from "rxjs"
import { filter } from "rxjs/operators"
import  { SidbarService } from "src/app/core/services/sidbar.service"
import  { UserViewService } from "src/app/core/services/user-view.service"

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992 // Initialize screen size detection

  @HostListener("window:resize", [])
  onResize() {
    this.isSmallScreen = window.innerWidth < 992
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (
      this.isNavbarOpen &&
      this.elementRef.nativeElement.querySelector("#navbarNav") &&
      !this.elementRef.nativeElement.querySelector("#navbarNav").contains(event.target as Node) &&
      !this.elementRef.nativeElement.querySelector(".navbar-toggler").contains(event.target as Node)
    ) {
      this.isNavbarOpen = false
    }
  }
  isCollapsed = false
  userAvatar: string | null = null
  currentView: "tenant" | "landlord" = "tenant"
  current = ""
  private viewSubscription: Subscription | null = null
  private routerSubscription: Subscription | null = null
  private sidebarSubscription: Subscription | null = null
  @ViewChild("emailContent") emailContent!: TemplateRef<any>
  @ViewChild("notificationContent") notificationContent!: TemplateRef<any>

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    private elementRef: ElementRef, // Add ElementRef for DOM access
  ) {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth < 992

    // Subscribe to router events to update the `current` variable whenever the route changes.
    this.routerSubscription = this.router.events
      .pipe(filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.current = event.urlAfterRedirects
        // Close navbar when route changes
        this.isNavbarOpen = false
      })

    // Initialize `current` with the current URL.
    this.current = this.router.url

    // Subscribe to view changes if needed.
    this.viewSubscription = this.userViewService.currentView$.subscribe((view) => {
      this.currentView = view
    })

    // Subscribe to sidebar collapsed state
    this.sidebarSubscription = this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state
    })

    // Fetch user avatar.
    this.fetchUserAvatar()
  }

  ngOnDestroy(): void {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe()
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe()
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe()
    }
  }

  fetchUserAvatar(): void {
    // Placeholder for API call to get user avatar.
    setTimeout(() => {
      this.userAvatar = ""
    }, 500)
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar()
  }

  logout(): void {
    localStorage.removeItem("token")
    localStorage.removeItem("userView")
    this.router.navigate(["/login"])
  }

  switchView(): void {
    const newView = this.currentView === "tenant" ? "landlord" : "tenant"
    this.userViewService.switchView(newView)
  }

  BackTo() {
    this.router.navigate(["/dashboard"])
  }

  isNavbarOpen = false

  toggleNavbar(event: Event) {
    event.stopPropagation() // Prevent document click from immediately closing
    this.isNavbarOpen = !this.isNavbarOpen
  }
}

