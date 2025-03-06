import { Component,  OnInit } from "@angular/core"
import  { Router } from "@angular/router"
import  { SidbarService } from "src/app/services/sidbar.service"

@Component({
  selector: "app-sidbar",
  templateUrl: "./sidbar.component.html",
  styleUrls: ["./sidbar.component.css"],
})
export class SidbarComponent implements OnInit {
  isCollapsed = false
  isHovering = false

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
  ) {}

  ngOnInit() {
    // Subscribe to the collapsed state from the service
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state
    })

    // Subscribe to the hovering state
    this.sidbarService.isHovering.subscribe((state: boolean) => {
      this.isHovering = state
    })
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar()
  }

  // Handle mouse enter event
  onMouseEnter() {
    if (this.isCollapsed) {
      this.sidbarService.setHoveringState(true)
    }
  }

  // Handle mouse leave event
  onMouseLeave() {
    if (this.isCollapsed) {
      this.sidbarService.setHoveringState(false)
    }
  }

  BackTo() {
    this.router.navigate(["/summary"])
  }

  logout(): void {
    localStorage.removeItem("token")
    this.router.navigate(["/login"])
  }
  
}

