import { Component, OnInit } from '@angular/core';
import { SourcesService, WebsiteMetadata } from '../../../services/sources-service.service';

interface Source {
  id: number;
  name: string;
  description: string;
  logo: string;
  url: string;
  loadError?: boolean;
}

@Component({
  selector: 'app-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.css']
})
export class SourcesComponent implements OnInit {
  sources: Source[] = [];
  sidebarCollapsed: boolean = false;
  showAddModal: boolean = false;
  isLoading: boolean = false;

  constructor(private sourcesService: SourcesService) {}

  ngOnInit(): void {
    this.loadSources();
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  loadSources(): void {
    this.isLoading = true;
    // Simulate loading sources
    setTimeout(() => {
      this.sources = [];
      this.isLoading = false;
    }, 1000);
  }

  handleAddSource(url: string): void {
    this.isLoading = true;
    this.sourcesService.getWebsiteMetadata(url).subscribe({
      next: (metadata: WebsiteMetadata) => {
        const newSource: Source = {
          id: this.sources.length + 1,
          name: metadata.title || 'Untitled',
          description: metadata.description,
          logo: metadata.favicon || this.getFallbackIcon(url),
          url: url,
          loadError: !metadata.success
        };
        
        this.sources = [...this.sources, newSource];
        this.closeAddSourceModal();
      },
      error: (error) => {
        console.error('Error adding source:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  

  toggleOptions(source: Source): void {
    // Implement options menu logic here
    console.log('Toggle options for source:', source);
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  openAddSourceModal(): void {
    this.showAddModal = true;
  }

  closeAddSourceModal(): void {
    this.showAddModal = false;
  }

  private getFallbackIcon(url: string): string {
    const hostname = this.sourcesService.getHostnameFromURL(url);
    return `https://icon.horse/icon/${hostname}`;
  }

  handleImageError(source: Source): void {
    if (!source.loadError) {
      source.loadError = true;
      source.logo = this.getFallbackIcon(source.url);
    }
  }
}

