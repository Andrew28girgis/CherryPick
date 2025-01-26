import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kayak-home',
  templateUrl: './kayak-home.component.html',
  styleUrls: ['./kayak-home.component.css']
})
export class KayakHomeComponent implements OnInit {
  activeComponent: string = '';
  isCollapsed: boolean = false; 

  constructor(public router: Router) {}


  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
  
  ngOnInit() {
    this.setActiveComponent('emily');
  }

  setActiveComponent(componentName: string) {
    this.activeComponent = componentName;
  }

  getActiveComponent(): string {
    return this.activeComponent;
  }

}
