import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MicrosoftMailsService } from 'src/app/shared/services/microsoft-mails.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-my-inbox-email-list',
  standalone: true,
  imports: [CommonModule],
  providers: [MicrosoftMailsService],
  templateUrl: './my-inbox-email-list.component.html',
  styleUrl: './my-inbox-email-list.component.css',
})
export class MyInboxEmailListComponent implements OnInit {
  Inboxs: any;
  mailInfo: any;
  mailIdnum!: number;
  contactId!: any;
  constructor(
    private modalService: NgbModal,
    private microsoftMailsService: MicrosoftMailsService
  ) {}

  ngOnInit(): void {
    this.contactId = localStorage.getItem('contactId');
    this.MyInbox();
  }

  MyInbox() {
    this.microsoftMailsService.MyInbox(this.contactId).subscribe({
      next: (data: any) => {
        this.Inboxs = data;
      },
    });
  }

  GetMailInfo(mailId: number, modal: any) {
    this.microsoftMailsService.GetMailInfo(mailId).subscribe({
      next: (data: any) => {
        this.mailInfo = data;
        this.modalService.open(modal, { size: 'xl', backdrop: true });
        // const url = `/email-read/${this.mailIdnum}`;
        // window.open(url, '_blank');
      },
    });
  }
}
