import { Component, ViewChild, type TemplateRef } from "@angular/core"
import { Router } from "@angular/router"
import  { SidbarService } from "src/app/services/sidbar.service"

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent {
  isCollapsed = true
  notifications: any[] = [
    { id: 1, message: "New notification 1", time: "5 min ago" },
    { id: 2, message: "New notification 2", time: "1 hour ago" },
    { id: 3, message: "New notification 3", time: "2 hours ago" },
  ]
  emails: any[] = [
    { id: 1, subject: "Upcoming meeting", from: "john@example.com", time: "10:00 AM" },
    { id: 2, subject: "Project update", from: "sarah@example.com", time: "11:30 AM" },
    { id: 3, subject: "Weekly report", from: "mike@example.com", time: "2:00 PM" },
  ]

  @ViewChild("emailContent") emailContent!: TemplateRef<any>
  @ViewChild("notificationContent") notificationContent!: TemplateRef<any>

  constructor(private sidbarService: SidbarService ,   public router: Router) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state
    })
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar()
  }

  
  logout(): void {
    localStorage.removeItem("token")
    this.router.navigate(["/login"])
  }
  
  BackTo() {
    this.router.navigate(["/summary"])
  }
  isNavbarOpen = false;

toggleNavbar() {
  this.isNavbarOpen = !this.isNavbarOpen;
}

}

