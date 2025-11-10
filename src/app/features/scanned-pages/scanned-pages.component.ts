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
  filterStatus: 'all' | 'successed' | 'failed' = 'all';

  constructor(private placeService: PlacesService) {}

  ngOnInit(): void {
    this.getScannedPages();
  }

  getScannedPages(): void {
    const body: any = { Name: 'GetScanPage', Params: {} };
    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.scannedPages = res?.json || [];
        this.applyStatusFilter();
      },
    });
  }

  toggleView(mode: 'table' | 'card') {
    this.viewMode = mode;
  }

  changeFilter(status: 'all' | 'successed' | 'failed') {
    this.filterStatus = status;
    this.applyStatusFilter();
  }

  applyStatusFilter() {
    this.filteredPages =
      this.filterStatus === 'all'
        ? this.scannedPages
        : this.scannedPages.filter((p) => p.status === this.filterStatus);
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }
}
