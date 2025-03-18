import { Component } from '@angular/core';
import { TenantComponent } from "../tenant/tenant.component";

@Component({
  selector: 'app-tenant-with-polygons',
  standalone: true,
  imports: [TenantComponent],
  templateUrl: './tenant-with-polygons.component.html',
  styleUrl: './tenant-with-polygons.component.css'
})
export class TenantWithPolygonsComponent {

}
