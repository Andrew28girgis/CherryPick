import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { forkJoin } from 'rxjs';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: string;
}

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
})
export class TreeComponent implements OnInit, AfterViewInit {
  allData: any[] = [];
  groupedData: { contacts: any[]; organizations: any[]; shopping: any[] } = {
    contacts: [],
    organizations: [],
    shopping: [],
  };

  connections: any[] = [];
  lines: Line[] = [];

  constructor(
    private elementRef: ElementRef,
    private placesService: PlacesService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    const distinctObjectsReq = this.placesService.GenericAPI({
      Name: 'GetDistinctObjects',
      Params: {},
    });
    const connectionsReq = this.placesService.GenericAPI({
      Name: 'GetObjectsConnections',
      Params: {},
    });

    forkJoin([distinctObjectsReq, connectionsReq]).subscribe(
      ([distinctObjectsRes, connectionsRes]: any[]) => {
        this.allData = distinctObjectsRes?.json || [];
        this.connections = connectionsRes?.json || [];

        // group dynamically by first character of ID
        this.groupedData = {
          contacts: this.allData.filter((x) => x.id.startsWith('C')),
          organizations: this.allData.filter((x) => x.id.startsWith('O')),
          shopping: this.allData.filter((x) => x.id.startsWith('S')),
        };

        setTimeout(() => this.calculateLines(), 300);
      }
    );
  }

  ngAfterViewInit(): void {}

  private getAnchor(
    el: HTMLElement,
    side: 'left' | 'right',
    containerRect: DOMRect
  ) {
    const rect = el.getBoundingClientRect();
    return {
      x:
        side === 'left'
          ? rect.left - containerRect.left
          : rect.right - containerRect.left,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  }

  calculateLines(): void {
    this.lines = [];

    const container =
      this.elementRef.nativeElement.querySelector('.tree-container');
    const containerRect = container?.getBoundingClientRect();
    if (!containerRect) return;

    this.connections.forEach((conn, idx) => {
      // Define IDs and find corresponding elements
      const contactId = conn.contactId ? `C${conn.contactId}` : null;
      const orgId = conn.organizationId ? `O${conn.organizationId}` : null;
      const shopId = conn.shoppingCenterId ? `S${conn.shoppingCenterId}` : null;

      const contactEl = contactId
        ? document.getElementById(`node-${contactId}`)
        : null;
      const orgEl = orgId ? document.getElementById(`node-${orgId}`) : null;
      const shopEl = shopId ? document.getElementById(`node-${shopId}`) : null;

      // Connection 1: Contact → Organization
      if (contactEl && orgEl) {
        const contactAnchor = this.getAnchor(contactEl, 'right', containerRect);
        const orgAnchor = this.getAnchor(orgEl, 'left', containerRect);

        this.lines.push({
          x1: contactAnchor.x,
          y1: contactAnchor.y,
          x2: orgAnchor.x,
          y2: orgAnchor.y,
          id: `${contactId}-${orgId}-${idx}`,
        });
      }

      // Connection 2: Organization → Shopping Center
      if (orgEl && shopEl) {
        const orgAnchor = this.getAnchor(orgEl, 'right', containerRect);
        const shopAnchor = this.getAnchor(shopEl, 'left', containerRect);

        this.lines.push({
          x1: orgAnchor.x,
          y1: orgAnchor.y,
          x2: shopAnchor.x,
          y2: shopAnchor.y,
          id: `${orgId}-${shopId}-${idx}`,
        });
      }
    });
  }
}
