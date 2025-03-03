import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AccordionModule } from 'primeng/accordion';
import { BuyBoxEmails, Stages } from 'src/models/buy-box-emails';

@Component({
  selector: 'app-stage-email',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, AccordionModule],
  providers: [
    NgxSpinnerService,
    PlacesService,
  ],
  templateUrl: './stage-email.component.html',
  styleUrl: './stage-email.component.css'
})

export class StageEmailComponent implements OnInit {
  buyBoxId!: any;
  BuyBoxEmails: BuyBoxEmails[] = [];
  Stages: Stages[] = [];
  stageEmailsMap: { [key: number]: BuyBoxEmails[] } = {};

  constructor(public spinner: NgxSpinnerService, private PlacesService: PlacesService) { }

  ngOnInit(): void {
    this.buyBoxId = localStorage.getItem('BuyBoxId');
    this.GetBuyBoxEmails();
    this.GetStages();
  }

  GetBuyBoxEmails() {
    this.spinner.show();

    const body: any = {
      Name: 'GetBuyBoxMicroDeals',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.BuyBoxEmails = data.json;
        } else {
          this.BuyBoxEmails = [];
        }
        this.mergeStagesWithBuyBoxEmails();
        this.spinner.hide();
      },
    });
  }

  GetStages() {
    this.spinner.show();

    const body: any = {
      Name: 'GetStages',
      MainEntity: null,
      Params: {
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.Stages = data.json;
        } else {
          this.Stages = [];
        }
        this.mergeStagesWithBuyBoxEmails();
        this.spinner.hide();
      },
    });
  }

  mergeStagesWithBuyBoxEmails() {
    if (this.BuyBoxEmails.length > 0 && this.Stages.length > 0) {
      this.Stages.forEach((stage: Stages) => {
        const matchingEmails = this.BuyBoxEmails.filter(
          (buyBoxEmail: BuyBoxEmails) => buyBoxEmail.StageId === stage.id
        );

        this.stageEmailsMap[stage.id] = matchingEmails;
      });
    }
  }
}
