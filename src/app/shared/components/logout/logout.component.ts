import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {

  constructor(public router: Router) {
  }

  logout(): void {
    localStorage.removeItem('token');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 10);
  }
  
}
