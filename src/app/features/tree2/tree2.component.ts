import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FCanvasComponent } from '@foblex/flow';
import { PlacesService } from 'src/app/core/services/places.service';
import { FlowObject, FlowConnection } from 'src/app/shared/models/nodes';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-tree2',
  templateUrl: './tree2.component.html',
  styleUrls: ['./tree2.component.css'],
})
export class Tree2Component implements OnInit {
  objects: FlowObject[] = [];
  initialobjects: FlowObject[] = [];
  connections: FlowConnection[] = [];
  today = new Date();
  // Keep full data for reset
  allObjects: FlowObject[] = [];
  allConnections: FlowConnection[] = [];
  selectedEmail: { Id: number; Body: string; Subject: string,Date:Date } | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragThreshold = 5;
  @ViewChild(FCanvasComponent) canvas!: FCanvasComponent;
  @ViewChild('emailModal') emailModal!: TemplateRef<any>;

  constructor(
    private placesService: PlacesService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadObjects();
    this.loadConnections();
  }

  // --- API Calls ---
  loadObjects() {
    const body = { Name: 'GetDistinctObjects', Params: {} };

    this.placesService.GenericAPI(body).subscribe((res: any) => {
      this.allObjects = res.json.map((obj: any, index: number) => {
        let rowY = 0;
        if (obj.id.startsWith('O')) rowY = 100;
        if (obj.id.startsWith('S')) rowY = 300;
        if (obj.id.startsWith('C')) rowY = 500;

        return {
          ...obj,
          position: { x: 100 + (index % 8) * 220, y: rowY },
        };
      });

      this.objects = [...this.allObjects];
      this.initialobjects = JSON.parse(JSON.stringify(this.allObjects));
    });
  }

  loadConnections() {
    const body = { Name: 'GetObjectsConnections', Params: {} };

    this.placesService.GenericAPI(body).subscribe((res: any) => {
      const data = res.json;
      this.allConnections = [];

      // Convert all dates
      const parsedConnections = data.flatMap((item: any) => [
        {
          from: item.organizationId,
          to: item.shoppingCenterId,
          date: new Date(item.date),
        },
        {
          from: item.shoppingCenterId,
          to: item.contactId,
          date: new Date(item.date),
        },
      ]);

      const now = new Date();

      // Assign class based on difference in days
      this.allConnections = parsedConnections.map((conn: any) => {
        const diffMs = now.getTime() - conn.date.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24); // ms → days

        let date = 'very-far-date'; // default
        if (diffDays <= 3) {
          date = 'near-date';
        } else if (diffDays <= 10) {
          date = 'mid-date';
        } else if (diffDays <= 30) {
          date = 'far-date';
        } else {
          date = 'very-far-date';
        }

        return { ...conn, date };
      });

      this.connections = [...this.allConnections];
    });
  }

  // --- Focus mode ---
  focusOn(nodeId: string) {
    const visibleNodes = new Set<string>();
    const visibleConnections: FlowConnection[] = [];

    const explore = (id: string) => {
      if (visibleNodes.has(id)) return;
      visibleNodes.add(id);

      const related = this.allConnections.filter(
        (c) => c.from === id || c.to === id
      );
      for (const conn of related) {
        visibleConnections.push(conn);
        explore(conn.from);
        explore(conn.to);
      }
    };

    explore(nodeId);

    this.objects = this.allObjects.filter((o) => visibleNodes.has(o.id));
    this.connections = visibleConnections;

    // ✅ Center on the clicked node
    setTimeout(() => this.canvas.centerGroupOrNode(nodeId, true));
  }

  resetView() {
    this.objects = this.initialobjects
    this.connections = [...this.allConnections];
    // reset zoom + position
    // this.canvas.resetScaleAndCenter(true);
  }

  onMouseDown(event: MouseEvent, nodeId: string) {
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  onMouseUp(event: MouseEvent, nodeId: string) {
    const dx = Math.abs(event.clientX - this.dragStartX);
    const dy = Math.abs(event.clientY - this.dragStartY);

    if (dx < this.dragThreshold && dy < this.dragThreshold) {
      // ✅ It was a real click, not a drag
      this.focusOn(nodeId);
    }
  }

  onConnectionClick(conn: { from: string; to: string }) {
    const fromto = `${conn.from},${conn.to}`;
    const body: any = {
      Name: 'GetTheRelationsData',
      Params: { Objects: fromto },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.selectedEmail = res.json[0];
        this.modalService.open(this.emailModal, { size: 'xl' });
      },
    });
  }
}
