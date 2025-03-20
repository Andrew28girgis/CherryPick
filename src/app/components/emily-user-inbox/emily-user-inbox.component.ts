import { Component, Input, OnInit } from '@angular/core';
import { Contact, EmailInfo, Mail } from 'src/app/shared/models/buy-box-emails';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-emily-user-inbox',
  templateUrl: './emily-user-inbox.component.html',
  styleUrl: './emily-user-inbox.component.css',
})
export class EmilyUserInboxComponent implements OnInit {
  UserInbox: any[] = [];
  buyboxTypes: any[] = [];
  OrgBuybox: any[] = [];
  activeBuyBoxId: number | null = null;
  loginContact: any;
  selectedEmail: EmailInfo | null = null;
  selectedMicroDealId!: number;
  isScrolling = false;
  private scrollTimeout: any;
  bodyemail: any;
  contactIdemail: any;
  orgId!: any;
  buyBoxId!: any;
  buyBoxIdReplay!: any;
  selectedContact: any;

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private router: Router,
    private modalService: NgbModal,
    private _location: Location,
  ) { }

  ngOnInit() {
    this.GetUserInbox();
    this.getUserBuyBoxes();
  }

  GetUserInbox(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetTenantRepInbox',
      MainEntity: null,
      Params: {
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.UserInbox = data.json;
          console.log(this.UserInbox);

          this.spinner.hide();

        } else {
          this.UserInbox = [];
        }
      }
    });
  }

  GetOrgbuyBox(buyboxId: number): void {
    if (this.activeBuyBoxId === buyboxId) {
      this.OrgBuybox = [];
      this.activeBuyBoxId = null;
      return;
    }
    this.activeBuyBoxId = buyboxId;
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationsByBuyBox',
      MainEntity: null,
      Params: {
        BuyBoxId: buyboxId
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.OrgBuybox = data.json;
          this.spinner.hide();
        } else {
          this.OrgBuybox = [];
        }
      }
    });
  }

  getUserBuyBoxes(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json != null) {
          this.buyboxTypes = data.json;
          this.spinner.hide();
        } else {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  openEmail(email: any): void {
    this.orgId = email.organizationId;
    this.selectedContact = email.contactId;
    this.buyBoxIdReplay = email.buyBoxId;

    this.GetMail(email.id);
    setTimeout(() => {
      const emailDetailsSection = document.querySelector(
        '.email-details-body'
      ) as HTMLElement;
      if (emailDetailsSection) {
        this.smoothScrollTo(emailDetailsSection, 300);
      }
    }, 100);
  }

  smoothScrollTo(element: HTMLElement, duration: number) {
    const targetPosition = element.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    function animationStep(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      window.scrollTo(0, startPosition + distance * ease);
      if (elapsedTime < duration) {
        requestAnimationFrame(animationStep);
      }
    }
    requestAnimationFrame(animationStep);
  }

  onScroll(): void {
    if (!this.isScrolling) {
      this.isScrolling = true;
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  GetMail(mailId: number): void {
    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: {
        mailid: mailId,
        identity: this.loginContact,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.selectedEmail = data.json[0];
          this.selectedMicroDealId = this.selectedEmail!.MicroDealId;
        } else {
          this.selectedEmail = null;
        }
      },
    });
  }

  openmodel(modal: any, body: any, contactId: any) {
    this.bodyemail = body;
    this.contactIdemail = contactId;
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }

  goBack() {
    this._location.back();
  }
}
