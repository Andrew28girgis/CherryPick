import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EmailDashboard } from 'src/app/shared/models/buy-box-emails';
import { TableModule } from 'primeng/table';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-email-dashboard',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, TableModule],
  providers: [NgxSpinnerService, PlacesService],
  templateUrl: './email-dashboard.component.html',
  styleUrl: './email-dashboard.component.css',
})
export class EmailDashboardComponent implements OnInit {
  buyBoxId!: any;
  EmailDashboard: any[] = [];
  cols!: Column[];

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService
  ) {}

  ngOnInit(): void {
    this.buyBoxId = localStorage.getItem('BuyBoxId');

    this.cols = [
      { field: 'Organizations', header: 'Organizations' },
      { field: 'Last Activity Date', header: 'Last Activity Date' },
    ];
    this.GetEmailDashboard();
  }

  GetEmailDashboard(): void {
    this.spinner.show();

    const body: any = {
      Name: 'EmailDashboard',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.EmailDashboard = data.json;
        } else {
          this.EmailDashboard = [];
        }
        this.spinner.hide();
      },
    });
  }

  openOrg(idOrg: number, IdStage: number): void {}
}
