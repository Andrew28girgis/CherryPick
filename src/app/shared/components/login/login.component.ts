import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { adminLogin as AdminLogin } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlacesService } from 'src/app/core/services/places.service';
import * as CryptoJS from 'crypto-js';
import { EncodeService } from 'src/app/core/services/encode.service';
import { DecodeService } from 'src/app/core/services/decode.service';
import { DropboxService } from 'src/app/core/services/dropbox.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private readonly MICROSOFT_LINKED_KEY = 'accountMicrosoftLinked';
  private readonly CONTACT_ID_KEY = 'contactId';
  private readonly ORG_ID_KEY = 'orgId';
  private readonly MAP_VIEW_KEY = 'mapView';
  private key = CryptoJS.enc.Utf8.parse('YourSecretKey123YourSecretKey123');
  private iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  public loginData!: AdminLogin;
  private loginToken: string | null = null;
  public showPassword: boolean = false;
  public errorMessage: string | null = null;
  public fadeSuccess: boolean = false;
  userEmail!: string;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    private readonly spinner: NgxSpinnerService,
    private readonly authService: AuthService,
    private decodeService: DecodeService,
    private dropboxService: DropboxService
  ) {
    localStorage.removeItem(this.MAP_VIEW_KEY);
  }

  ngOnInit(): void {
    this.initializeData();
    this.handleRouteParams();
  }

  private initializeData(): void {
    this.loginData = new AdminLogin();
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

  private loginWithGUID(): void {
    this.spinner.show();
    const request = {
      Name: 'GetBuyBoxIdToBeShown',
      Params: {
        BuyBoxGUID: this.loginToken,
      },
    };
    this.placesService.GenericAPI(request).subscribe({
      next: (response) => {
        this.handleGUIDLoginSuccess(response);
      },
      complete: () => {
        this.spinner.hide();
      },
    });
  }

  private handleGUIDLoginSuccess(response: any): void {
    const {
      organizationId,
      buyBoxId,
      name: buyboxName,
      campaignId,
    } = response.json[0];
    localStorage.setItem(this.ORG_ID_KEY, organizationId);

    this.router.navigate(['/market-survey'], {
      queryParams: {
        buyBoxId: buyBoxId,
        orgId: organizationId,
        buyboxName: buyboxName,
        campaignId: campaignId,
      },
    });
  }

  private prepareLoginRequest(): AdminLogin {
    const encryptedLoginData = new AdminLogin();
    encryptedLoginData.Email = this.loginData.Email;
    encryptedLoginData.Password = this.encrypt(this.loginData.Password);
    if (this.loginToken) {
      encryptedLoginData.contactToken = this.loginToken;
    }
    return encryptedLoginData;
  }

  public onSubmit(): void {
    const loginRequest = this.prepareLoginRequest();
    this.userEmail = loginRequest.Email;
    this.getUserToken(this.userEmail);
    this.placesService.newLoginUser(loginRequest).subscribe({
      next: (response: any) => {
        this.handleLoginSuccess(response);
      },
      error: (err: any) => {
        this.handleLoginError();
      },
      complete: () => {
        this.spinner.hide();
      },
    });
  }

  getUserToken(email: string): void {
    const userEmail = email;
    this.placesService.userToken(userEmail).subscribe({
      next: (response: any) => {
        if (response) {
          const userToken = response.encodedAccessToken;
          const refreshToken = response.encodedRefreshToken;
          console.log('User Token:', userToken);
          console.log('Refresh Token:', refreshToken);
          const decodedUserToken = this.decodeService.decodeToString(userToken);
          console.log('Decoded User Token:', decodedUserToken);
          this.dropboxService.setToken(decodedUserToken);
          this.dropboxService.setRefreshToken(refreshToken);
        } else {
          this.errorMessage = 'Failed to retrieve user token.';
        }
      },
      error: (err: any) => {
        // this.errorMessage = 'Error retrieving user token. Please try again.';
      },
      complete: () => {
        this.spinner.hide();
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
    if (response.token) {
      this.authService.setToken(response.token);
      this.navigateToHome();
    }
    if (response.guidSignature) {
      localStorage.setItem('guid', response.guidSignature);
    }
  }

  private navigateToHome(): void {
    this.router.navigate(['/summary']);
  }

  private handleLoginError(): void {
    this.errorMessage = 'Invalid email or password. Please try again.';

    setTimeout(() => {
      this.fadeSuccess = true;
    }, 4000);

    setTimeout(() => {
      this.errorMessage = null;
      this.fadeSuccess = false;
    }, 4000);
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
