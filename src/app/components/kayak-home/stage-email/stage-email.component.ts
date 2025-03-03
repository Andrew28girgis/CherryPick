import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AccordionModule } from 'primeng/accordion';
import {  BuyBoxMicroDeals,  Stages,  BuyBoxEmails, Mail,Contact, EmailInfo} from 'src/models/buy-box-emails';
import { CardModule } from 'primeng/card';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-stage-email',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, AccordionModule,CardModule],
  providers: [NgxSpinnerService, PlacesService],
  templateUrl: './stage-email.component.html',
  styleUrl: './stage-email.component.css',
})

export class StageEmailComponent implements OnInit {
  buyBoxId!: any;
  BuyBoxMicroDeals: BuyBoxMicroDeals[] = [];
  BuyBoxEmails: BuyBoxEmails[] = [];
  Stages: Stages[] = [];
  stageEmailsMap: { [key: number]: BuyBoxMicroDeals[] } = {};
  emailsForContact: Mail[] = [];
  selectedContact: Contact | null = null;
  Emails:EmailInfo[] = [];

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.buyBoxId = localStorage.getItem('BuyBoxId');
    this.GetBuyBoxMicroDeals();
    this.GetBuyBoxEmails();
    this.GetStages();
  }

  GetBuyBoxEmails(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetBuyBoxEmails',
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
        this.spinner.hide();
      },
    });
  }

  GetBuyBoxMicroDeals(): void {
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
          this.BuyBoxMicroDeals = data.json;
        } else {
          this.BuyBoxMicroDeals = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  GetStages(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetStages',
      MainEntity: null,
      Params: {},
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.Stages = data.json;
        } else {
          this.Stages = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  GetMail(mailId:number,modal: any): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: {
        mailid : mailId
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.Emails = data.json;
          this.modalService.open(modal, { size: 'xl', backdrop: true });
        } else {
          this.Emails = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  mergeStagesWithGetBuyBoxMicroDeals(): void {
    if (this.BuyBoxMicroDeals.length > 0 && this.Stages.length > 0) {
      this.Stages.forEach((stage: Stages) => {
        const matchingEmails = this.BuyBoxMicroDeals.filter(
          (buyBoxEmail: BuyBoxMicroDeals) => buyBoxEmail.StageId === stage.id
        );

        this.stageEmailsMap[stage.id] = matchingEmails;
      });
    }
  }

  getEmailsForContact(contact: Contact, microdealId: number): void {
    this.emailsForContact = [];
    this.selectedContact = contact; 

    const matchingEmails = this.BuyBoxEmails
      .filter((buyBoxEmail) => buyBoxEmail.MicrodealId === microdealId)
      .flatMap((buyBoxEmail) => buyBoxEmail.mail)
      .filter((mail) => mail.ContactId === contact.ContactId);
    this.emailsForContact.push(...matchingEmails);

    console.log(this.emailsForContact);
  }
}
