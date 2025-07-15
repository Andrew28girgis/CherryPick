import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom, Observable } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-link-accounts',
  templateUrl: './link-accounts.component.html',
  styleUrl: './link-accounts.component.css',
})
export class LinkAccountsComponent implements OnInit {
  private guid!: string;

  protected firstTimeOpen: boolean = true;
  protected MICROSOFT_CONNECT_LINK = '';
  protected GOOGLE_CONNECT_LINK = '';
  protected microsoftState: number = 1; // 1: not linked, 2: linking, 3: linked
  protected googleState: number = 1;

  @Output() accountUnlinked = new EventEmitter<boolean>();

  constructor(
    private genericApiService: PlacesService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('settings')) this.firstTimeOpen = false;

    const guid = localStorage.getItem('guid');
    if (guid) this.guid = guid;
    this.checkOwnerData();
  }

  private getOwnerData(guid: string): Observable<any> {
    const contactRequestBody = {
      Name: 'GetContactDataFromGUID',
      Params: {
        GUIDSignature: guid,
      },
    };
    return this.genericApiService.BetaGenericAPI(contactRequestBody);
  }

  private async checkOwnerData(): Promise<void> {
    if (!this.guid) return;

    const response = await firstValueFrom(this.getOwnerData(this.guid.trim()));
    if (response.json && response.json.length) {
      const googleAccessToken = response.json[0].googleAccessToken;
      const microsoftAccessToken = response.json[0].microsoftAccessToken;

      if (googleAccessToken) {
        this.googleState = 3;
        // this.GoogleGetContactFolders();
      }

      if (microsoftAccessToken) {
        this.microsoftState = 3;
        // this.GetContactFolders();
      }

      if (response.json[0].id) {
        this.MICROSOFT_CONNECT_LINK = `${environment.API_URL}/auth/signin?ContactId=${response.json[0].id}`;
        this.GOOGLE_CONNECT_LINK = `${environment.API_URL}/GoogleAuth/signin?ContactId=${response.json[0].id}`;
      }
    }
  }

  protected UnlinkGoogle(event: any): void {
    event.preventDefault();

    const body = {
      Name: 'UnlinkGoogle',
      Params: {
        GUIDSignature: this.guid,
      },
    };
    this.genericApiService.GenericAPI(body).subscribe((response) => {
      this.genericApiService.BetaGenericAPI(body).subscribe();
      this.googleState = 1;
      this.accountUnlinked.emit(true);
      // this.googleContactFolders = [];
      // this.googleDomainList = [];
      // this.googleEmailsList = [];
      // this.updateIntervals();
    });
  }

  protected contactDidntWantToLinkAccount(): void {
    this.spinner.show();
    const body = {
      Name: 'ContactDidntWantToLinkAccount',
      Params: {},
    };
    this.genericApiService.BetaGenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      this.router.navigate(['/campaigns']);
    });
  }
}
