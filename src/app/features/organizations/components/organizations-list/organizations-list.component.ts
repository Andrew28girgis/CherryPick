import { Component } from '@angular/core';

@Component({
  selector: 'app-organizations-list',
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.css',
})
export class OrganizationsListComponent {
  protected dataLoaded: boolean = false;
}
