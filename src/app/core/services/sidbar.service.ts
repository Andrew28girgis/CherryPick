import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class SidbarService {
  private collapsed = new BehaviorSubject<boolean>(true)
  private hovering = new BehaviorSubject<boolean>(false)

  isCollapsed = this.collapsed.asObservable()
  isHovering = this.hovering.asObservable()

  toggleSidebar() {
    this.collapsed.next(!this.collapsed.value)
  }

  setCollapsedState(state: boolean) {
    this.collapsed.next(state)
  }

  setHoveringState(state: boolean) {
    this.hovering.next(state)
  }

  // Get the current value without subscribing
  getCollapsedValue(): boolean {
    return this.collapsed.value
  }
}

