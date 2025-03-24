import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  display: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.display = !(
        this.router.url === '/' ||
        this.router.url === '/login' ||
        this.router.url === '/tos'||
        this.router.url.startsWith('/home') ||
        this.router.url.startsWith('/landing')
      );
    });
  }
}
