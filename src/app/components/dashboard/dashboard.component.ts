import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil } from 'rxjs';
import { PlacesService } from 'src/app/services/places.service';
import { IDashboardBuyBox } from 'src/models/idashboard-buy-box';
import { IDashboardTenant } from 'src/models/idashboard-tenant';
import { IUserComment } from 'src/models/iuser-comment';
import { IUserInBox } from 'src/models/iuser-in-box';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contactId!: number;
  userInBox: IUserInBox[] = [];
  userComments: IUserComment[] = [];
  tenants: IDashboardTenant[] = [];
  buyBoxes: IDashboardBuyBox[] = [];
  selectedEmailBody: string = '';

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const contactId = localStorage.getItem('contactId');
    if (contactId) {
      this.contactId = +contactId;
    }
    this.getUserInbox();
    this.getUserComments();
    this.getDashboardTenants();
    this.getDashboardBuyBoxes();
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

  getDashboardTenants(): void {
    this.spinner.show();
    const body = {
      Name: 'GetTenantsDashboard',
      Params: {},
    };

    const observer = {
      next: (response: any) => {
        this.spinner.hide();
        if (response && response.json && response.json.length > 0) {
          this.tenants = response.json;
        }
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

  getDashboardBuyBoxes(): void {
    this.spinner.show();
    const body = {
      Name: 'GetBuyBoxesDashboard',
      Params: {},
    };

    const observer = {
      next: (response: any) => {
        this.spinner.hide();
        if (response && response.json && response.json.length > 0) {
          this.buyBoxes = response.json;
        }
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

  getUserCommentsCount(): number {
    let count = 0;
    this.userComments.forEach((userComment) =>
      userComment.ShoppingCenters.forEach(
        (center) => (count += center.PropertiesComments.length)
      )
    );
    return count;
  }

  openEmailBodyModal(content: TemplateRef<any>, body: string): void {
    this.selectedEmailBody = body;
    this.modalService.open(content, { centered: true, scrollable: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
