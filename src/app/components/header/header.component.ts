import { Component } from "@angular/core"
import  { SidbarService } from "src/app/services/sidbar.service"

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent {
  isCollapsed = true

  constructor(private sidbarService: SidbarService) {
    // Subscribe to the collapsed state
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state
    })
  }

  // Toggle the sidebar when the button is clicked
  toggleSidebar() {
    this.sidbarService.toggleSidebar()
  }
}

