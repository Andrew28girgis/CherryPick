import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-kayak-home',
  templateUrl: './kayak-home.component.html',
  styleUrls: ['./kayak-home.component.css']
})
export class KayakHomeComponent implements OnInit {
  activeComponent: string = '';
  constructor() {}

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
