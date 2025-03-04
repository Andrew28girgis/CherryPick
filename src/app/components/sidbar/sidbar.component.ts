import { Component } from "@angular/core"
import  { Router } from "@angular/router"
import  { SidbarService } from "src/app/services/sidbar.service"

@Component({
  selector: "app-sidbar",
  templateUrl: "./sidbar.component.html",
  styleUrls: ["./sidbar.component.css"],
})
export class SidbarComponent {
  isCollapsed = false

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => (this.isCollapsed = state))
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
    this.sidbarService.toggleSidebar()
  }

  BackTo() {
    this.router.navigate(["/summary"])
  }

  logout(): void {
    localStorage.removeItem("token")
    this.router.navigate(["/login"])
  }
}

