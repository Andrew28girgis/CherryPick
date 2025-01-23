import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidbarService } from 'src/app/services/sidbar.service';

@Component({
  selector: 'app-sidbar',
  templateUrl: './sidbar.component.html',
  styleUrls: ['./sidbar.component.css'],
  animations: [
    trigger('toggleWidth', [
      state('collapsed', style({ flexBasis: '5%' })),
      state('expanded', style({ flexBasis: '20%' })),
      transition('collapsed <=> expanded', animate('0.5s ease')),
    ])
  ]
})
export class SidbarComponent {
  isCollapsed = true;

  constructor(private sidbarService: SidbarService,public router: Router) {
    this.sidbarService.isCollapsed.subscribe(
      (state: boolean) => (this.isCollapsed = state)
    );
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar();
  }
}
