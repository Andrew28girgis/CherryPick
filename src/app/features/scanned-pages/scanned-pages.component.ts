import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';
import { FormsModule } from '@angular/forms';

interface ScanResult {
  sourceURL: string;
  status: string;
}

@Component({
  selector: 'app-scanned-pages',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './scanned-pages.component.html',
  styleUrls: ['./scanned-pages.component.css'],
})
export class ScannedPagesComponent implements OnInit {
  scannedPages: ScanResult[] = [];
  filteredPages: ScanResult[] = [];
  viewMode: 'table' | 'card' = 'table';
  filterStatus: 'all' | 'completed' | 'running' | 'pending' = 'all';
  searchTerm: string = '';

  constructor(private placeService: PlacesService) {}

  ngOnInit(): void {
    this.getScannedPages();
  }

  getScannedPages(): void {
    const body: any = { Name: 'GetScanPage', Params: {} };
    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const allPages = res?.json || [];

        this.scannedPages = allPages;
        this.applyStatusFilter();
      },
    });
  }

  toggleView(mode: 'table' | 'card') {
    this.viewMode = mode;
  }

  changeFilter(status: 'all' | 'completed' | 'running' | 'pending') {
    this.filterStatus = status;
    this.applyStatusFilter();
  }

  applyStatusFilter() {
    this.filteredPages =
      this.filterStatus === 'all'
        ? this.scannedPages
        : this.scannedPages.filter((p) => p.status === this.filterStatus);
  }
  getcompletedPagesCount(): number {
    return this.scannedPages.filter(
      (p) => p.status === 'completed' && p.sourceURL
    ).length;
  }
  getPendingPagesCount(): number {
    return this.scannedPages.filter(
      (p) => p.status === 'pending' && p.sourceURL
    ).length;
  }
  getrunningPagesCount(): number {
    return this.scannedPages.filter(
      (p) => p.status === 'running' && p.sourceURL
    ).length;
  }

  hasMultipleStatuses(): boolean {
    const statuses = this.scannedPages
      .filter((p) => !!p.sourceURL)
      .map((p) => p.status);

    return statuses.length > 1;
  }
  onSearchChange() {
    this.applyFilters();
  }
  applyFilters() {
    let filtered = this.scannedPages;

    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === this.filterStatus);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter((p) =>
        p.sourceURL.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredPages = filtered;
  }
}
