import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tenant-card',
 
  templateUrl: './tenant-card.component.html',
  styleUrl: './tenant-card.component.css'
})
export class TenantCardComponent {
  @Input() tenants: any; // Input property to accept tenant data from parent
  
  ngOnInit() {
    console.log(`Tenant Card Initialized`);
    
    console.log(this.tenants);
  }
}
