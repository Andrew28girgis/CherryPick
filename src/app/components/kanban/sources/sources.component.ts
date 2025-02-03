import { Component, OnInit } from '@angular/core';
import { Sources2Service, WebsiteMetadata } from '../../../services/sorces2.service';

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

  constructor(private sourcesService: Sources2Service) {}

  ngOnInit(): void {
    this.loadSources();
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  loadSources(): void {
    const savedSources = localStorage.getItem('sources');
    if (savedSources) {
      this.sources = JSON.parse(savedSources);
    }
  }

  handleAddSource(url: string): void {
    this.isLoading = true;
    this.sourcesService.getWebsiteMetadata(url).subscribe({
      next: (metadata: WebsiteMetadata) => {
        console.log('Received metadata:', metadata);
        const newSource: Source = {
          id: this.sources.length + 1,
          name: metadata.title,
          description: metadata.description,
          logo: metadata.favicon,
          url: url
        };
        
        console.log('Created new source:', newSource);
        this.sources = [...this.sources, newSource];
        this.saveSources();
        this.closeAddSourceModal();
      },
      error: (error) => {
        console.error('Error adding source:', error);
        const hostname = this.sourcesService.getHostnameFromURL(url);
        const fallbackSource: Source = {
          id: this.sources.length + 1,
          name: hostname,
          description: `Website link for ${hostname}`,
          logo: this.getFallbackIcon(url),
          url: url
        };
        this.sources = [...this.sources, fallbackSource];
        this.saveSources();
        this.closeAddSourceModal();
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  saveSources(): void {
    localStorage.setItem('sources', JSON.stringify(this.sources));
  }

  toggleOptions(source: Source): void {
    console.log('Toggle options for source:', source);
    // Implement options menu logic here
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

