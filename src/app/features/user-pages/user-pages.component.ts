import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';

interface UserPage {
  pageName: string;
  date: string;
}

// type ViewMode = "table" | "cards" | "timeline" | "list"
type ViewMode = 'cards' | 'list';

@Component({
  selector: 'app-user-pages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-pages.component.html',
  styleUrls: ['./user-pages.component.css'],
})
export class UserPagesComponent implements OnInit {
  userPages: UserPage[] = [];
  loading = false;
  error: string | null = null;
  currentView: ViewMode = 'cards';

  constructor(private placeService: PlacesService) {}

  ngOnInit(): void {
    this.loadFakeData();
    // this.getUserPages()
  }

  switchView(view: ViewMode): void {
    this.currentView = view;
  }

  loadFakeData(): void {
    this.userPages = [
      { pageName: 'Home Page', date: '2024-01-15T10:30:00Z' },
      { pageName: 'About Us', date: '2024-01-14T14:22:00Z' },
      { pageName: 'Contact Form', date: '2024-01-13T09:15:00Z' },
      { pageName: 'Product Catalog', date: '2024-01-12T16:45:00Z' },
      { pageName: 'User Dashboard', date: '2024-01-11T11:20:00Z' },
      { pageName: 'Settings Page', date: '2024-01-10T13:30:00Z' },
      { pageName: 'Privacy Policy', date: '2024-01-09T08:45:00Z' },
      { pageName: 'Terms of Service', date: '2024-01-08T15:10:00Z' },
    ];
    this.loading = false;
  }

  getUserPages(): void {
    this.loading = true;
    this.error = null;

    const body: any = {
      Name: 'GetUserPages',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.userPages = data.pages || data.result || data || [];
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load user pages. Please try again.';
        this.loading = false;
      },
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  retry(): void {
    this.getUserPages();
  }
}
