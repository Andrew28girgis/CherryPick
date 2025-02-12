import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidbarService } from 'src/app/services/sidbar.service';
import { Location } from '@angular/common';
import { LogoutComponent } from '../logout/logout.component';

@Component({
  selector: 'app-sidbar',
  templateUrl: './sidbar.component.html',
  styleUrls: ['./sidbar.component.css'],
  animations: [
    trigger('toggleWidth', [
      state('collapsed', style({ flexBasis: '5%' })),
      state('expanded', style({ flexBasis: '20%' })),
      transition('collapsed <=> expanded', animate('0.5s ease')),
    ]),
  ],
})
export class SidbarComponent {
  isCollapsed = true;

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private _location: Location
  ) {
    this.sidbarService.isCollapsed.subscribe(
      (state: boolean) => (this.isCollapsed = state)
    );
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar();
  }
  BackTo() {
    // this._location.back();
    this.router.navigate(['/summary']);
  }

  
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
