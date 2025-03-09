import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil } from 'rxjs';
import { PlacesService } from 'src/app/services/places.service';
import { IUserComment } from 'src/models/iuser-comment';
import { IUserInBox } from 'src/models/iuser-in-box';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private destroy$ = new Subject<void>();
  contactId!: number;
  userInBox: IUserInBox[] = [];
  userComments: IUserComment[] = [];

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    const contactId = localStorage.getItem('contactId');
    if (contactId) {
      this.contactId = +contactId;
    }
    this.getUserInbox();
    this.getUserComments();
  }

  getUserInbox(): void {
    this.spinner.show();
    const body = {
      Name: 'GetUserInbox',
      Params: {},
    };

    const observer = {
      next: (response: any) => {
        this.spinner.hide();
        if (response && response.json && response.json.length > 0) {
          this.userInBox = response.json;
        }
        console.log(this.userInBox);
      },
      error: (error: any) => {
        this.spinner.hide();
        console.error(error);
      },
    };

    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe(observer);
  }

  getUserComments(): void {
    this.spinner.show();
    const body = {
      Name: 'GetCommentsForUser',
      Params: {},
    };

    const observer = {
      next: (response: any) => {
        this.spinner.hide();
        if (response && response.json && response.json.length > 0) {
          this.userComments = response.json;
        }
        console.log(this.userComments);
      },
      error: (error: any) => {
        this.spinner.hide();
        console.error(error);
      },
    };

    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe(observer);
  }
}
