import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';

interface ScanResult {
  sourceURL: string;
  status: string;
}

@Component({
  selector: 'app-scanned-pages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scanned-pages.component.html',
  styleUrls: ['./scanned-pages.component.css'],
})
export class ScannedPagesComponent implements OnInit {
  scannedPages: ScanResult[] = [];
  filteredPages: ScanResult[] = [];
  viewMode: 'table' | 'card' = 'table';
  filterStatus: 'all' | 'successed' | 'failed' | 'pending' = 'all';

  constructor(private placeService: PlacesService) {}

  ngOnInit(): void {
    this.getScannedPages();
  }

  getScannedPages(): void {
    const body: any = { Name: 'GetScanPage', Params: {} };
    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const allPages = res?.json || [];
        const uniquePages = allPages.filter(
          (page: ScanResult, index: number, self: ScanResult[]) =>
            index === self.findIndex((p) => p.sourceURL === page.sourceURL)
        );

        this.scannedPages = uniquePages;
        this.applyStatusFilter();
      },
    });
  }

  toggleView(mode: 'table' | 'card') {
    this.viewMode = mode;
  }

  changeFilter(status: 'all' | 'successed' | 'failed' | 'pending') {
    this.filterStatus = status;
    this.applyStatusFilter();
  }

  applyStatusFilter() {
    this.filteredPages =
      this.filterStatus === 'all'
        ? this.scannedPages
        : this.scannedPages.filter((p) => p.status === this.filterStatus);
  }
  getsuccessedPagesCount(): number {
    return this.scannedPages.filter(
      (p) => p.status === 'successed' && p.sourceURL
    ).length;
  }
  getPendingPagesCount(): number {
    return this.scannedPages.filter(
      (p) => p.status === 'pending' && p.sourceURL
    ).length;
  }
  getfailedPagesCount(): number {
    return this.scannedPages.filter((p) => p.status === 'failed' && p.sourceURL)
      .length;
  }

 
  hasMultipleStatuses(): boolean {
    const statuses = new Set(
      this.scannedPages.filter((p) => !!p.sourceURL).map((p) => p.status)
    );
    return statuses.size > 1;
  }
}
