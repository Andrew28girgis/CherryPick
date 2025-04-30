import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  General,
  adminLogin as AdminLogin,
} from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlacesService } from 'src/app/core/services/places.service';

/**
 * LoginComponent handles user authentication and login functionality
 * including both email/password and GUID-based login methods.
 */
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

  public loginData!: AdminLogin;
  public general!: General;
  private loginToken: string | null = null;
  public showPassword: boolean = false;
  public errorMessage: string | null = null; 
  public fadeSuccess: boolean = false; 

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

  /**
   * Handles form submission for email/password login
   */
  public onSubmit(): void {
    const loginRequest = this.prepareLoginRequest();


    this.placesService.loginUser(loginRequest).subscribe({
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

  /**
   * Initializes login data and general settings
   */
  private initializeData(): void {
    this.general = new General();
    this.loginData = new AdminLogin();
    localStorage.clear();
  }

  /**
   * Handles route parameters and initiates GUID-based login if token is present
   */
  private handleRouteParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.loginToken = params.get('t');
      if (this.loginToken) {
        this.loginWithGUID();
      }
    });
  }

  /**
   * Handles login with GUID token
   */
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
    const { organizationId, buyBoxId, name: buyboxName } = response.json[0];
    localStorage.setItem(this.ORG_ID_KEY, organizationId);
    this.router.navigate(['/home', buyBoxId, organizationId, buyboxName]);
  }

  private prepareLoginRequest(): AdminLogin {
    if (this.loginToken) {
      this.loginData.contactToken = this.loginToken;
    }
    return this.loginData;
  }

  private handleLoginSuccess(response: any): void {
    localStorage.setItem(
      this.MICROSOFT_LINKED_KEY,
      response.accountMicrosoftLinked
    );
    localStorage.setItem(this.CONTACT_ID_KEY, response.contactId);
    localStorage.setItem(this.ORG_ID_KEY, response.orgId);

    this.authService.setToken(response.token);

    if (response.token) {
      this.navigateToHome();
    }
  }

  private navigateToHome(): void {
    this.router.navigate(['/summary']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
