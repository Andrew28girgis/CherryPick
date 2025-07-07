import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EmailData } from 'src/app/shared/models/emailInfo';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-email-info',
  templateUrl: './email-info.component.html',
  styleUrl: './email-info.component.css',
})
export class EmailInfoComponent implements OnInit {
  mailId: string | null = null;
  emailData: EmailData | null = null;
  loading: boolean = false;
  error: string | null = null;
   constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private genericApiService: PlacesService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.mailId = params.get('mailId') || '121931';
      this.getEmailInfo();
    });
  }

  getEmailInfo(): void {
    if (!this.mailId) {
      this.error = 'Mail ID is required';
      return;
    }

    this.loading = true;
    this.error = null;
    this.emailData = null;

    const body = {
      Name: 'GetAllEmailInfo',
      MainEntity: null,
      Params: {
        mailId: this.mailId,
      },
    };

    this.genericApiService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.error) {
          this.error = response.error;
        } else if (response.json && response.json.length > 0) {
          this.emailData = response.json[0];
        } else {
          this.error = 'No email data found';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load email data';
        this.loading = false;
        console.error('API Error:', err);
      },
    });
  }

 

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  refreshData(): void {
    if (this.mailId) {
      this.getEmailInfo();
    }
  }

  // Method to load data with a new mailId (useful for programmatic navigation)
  loadEmailById(newMailId: string): void {
    this.mailId = newMailId;
    this.getEmailInfo();
  }

  getDirectionText(direction: number): string {
    switch (direction) {
      case 1:
        return 'Incoming';
      case 2:
        return 'Outgoing';
      case 3:
        return 'Internal';
      case 4:
        return 'Draft';
      default:
        return 'Unknown';
    }
  }
}
