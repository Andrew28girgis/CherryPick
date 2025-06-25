import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import { Registeration } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlacesService } from 'src/app/core/services/places.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-registeration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxSpinnerModule],
  templateUrl: './registeration.component.html',
  styleUrl: './registeration.component.css',
})
export class RegisterationComponent implements OnInit {
  private readonly MICROSOFT_LINKED_KEY = 'accountMicrosoftLinked';
  private readonly CONTACT_ID_KEY = 'contactId';
  private readonly ORG_ID_KEY = 'orgId';
  private readonly MAP_VIEW_KEY = 'mapView';
  private key = CryptoJS.enc.Utf8.parse('YourSecretKey123YourSecretKey123');
  private iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  public loginData!: Registeration;
  private loginToken: string | null = null;
  public showPassword: boolean = false;
  public errorMessage: string | null = null;
  public fadeSuccess: boolean = false;
  public acceptedTerms: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    private readonly spinner: NgxSpinnerService,
    private readonly authService: AuthService
  ) {
    localStorage.removeItem(this.MAP_VIEW_KEY);
  }

  ngOnInit(): void {
    this.initializeData();
    this.handleRouteParams();
  }

  private initializeData(): void {
    this.loginData = new Registeration();
    localStorage.clear();
  }

  private handleRouteParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.loginToken = params.get('t');
      if (this.loginToken) {
        this.router.navigate(['/not-found']);
        // localStorage.setItem('loginToken', this.loginToken || '');
        // this.loginWithGUID();
      }
    });
  }

 public onSubmit(): void {
  const orgName = this.loginData.OrganizationName;
  const orgRequest = {
    Name: 'CreateOrganizationByName',
    Params: {
      'Name': orgName,
    },
  };

  this.spinner.show();

  this.placesService.GenericAPI(orgRequest).subscribe({
    next: (orgResponse: any) => {
      const orgId = orgResponse?.json?.[0]?.id;

      if (!orgId) {
        this.errorMessage = 'Failed to retrieve organization ID.';
        this.spinner.hide();
        return;
      }

      const contactRequest = {
        Name: 'CreateContact',
        Params: {
          'Firstname': this.loginData.FirstName,
          'Lastname': this.loginData.LastName,
          'OrganizationId': orgId,
          'Email': this.loginData.Email,
          'Password': this.encrypt(this.loginData.Password),
        },
      };

      this.placesService.GenericAPI(contactRequest).subscribe({
        next: () => {
          const loginRequest = {
            Email: this.loginData.Email,
            Password: this.encrypt(this.loginData.Password)
          };

          this.placesService.loginUser(loginRequest).subscribe({
            next: (loginResponse: any) => {
              this.handleLoginSuccess(loginResponse); 
            },
            complete: () => {
              this.spinner.hide();
            }
          });
        },
        error: () => {
          this.errorMessage = 'Failed to create contact.';
          this.spinner.hide();
        }
      });
    },
  });
}

  private handleLoginSuccess(response: any): void {
    localStorage.setItem(
      this.MICROSOFT_LINKED_KEY,
      response.accountMicrosoftLinked
    );
    localStorage.setItem(this.CONTACT_ID_KEY, response.contactId);
    localStorage.setItem(this.ORG_ID_KEY, response.orgId);
    this.navigateToHome();

    if (response.token) {
      this.authService.setToken(response.token);
      this.navigateToHome();
    }
  }

  private navigateToHome(): void {
    this.router.navigate(['/summary']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  encrypt(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value),
      this.key,
      {
        keySize: 256 / 8,
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encrypted.toString();
  }
}
