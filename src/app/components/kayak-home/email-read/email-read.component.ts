import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MicrosoftMailsService } from 'src/app/services/microsoft-mails.service';

@Component({
  selector: 'app-email-read',
  standalone: true,
  imports: [CommonModule],
  providers:[MicrosoftMailsService],
  templateUrl: './email-read.component.html',
  styleUrl: './email-read.component.css'
})
export class EmailReadComponent implements OnInit {
  mailId!: number;
  mailDetails: any;

  constructor(
    private route: ActivatedRoute,
    private microsoftMailsService: MicrosoftMailsService
  ) {}

  ngOnInit() {
    this.mailId = +this.route.snapshot.paramMap.get('MailId')!;
 
    this.microsoftMailsService.GetMailInfo(this.mailId).subscribe({
      next: (data: any) => {
        this.mailDetails = data;
      },
    });
  }
}
