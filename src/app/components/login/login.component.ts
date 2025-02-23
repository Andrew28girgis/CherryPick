import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General, adminLogin } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/services/config.service';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, BrowserAuthError } from '@azure/msal-browser';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  adminLogin!: adminLogin;
  wrongPassword = false;
  General!: General;
  logoUrl: string = '';
  t: any;
  r: any; 
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private configService: ConfigService,
    private msalService: MsalService
  ) {
    localStorage.removeItem('mapView');
  }

  async  ngOnInit() {

    this.General = new General();
    this.adminLogin = new adminLogin();
    this.logoUrl = this.configService.getLogoUrl();
    this.activatedRoute.queryParamMap.subscribe((params) => {
    this.t = params.get('t');
      if (this.t) {
        localStorage.clear(); 
        this.onSubmit();
      }else{
        // localStorage.getItem('token') && this.navigateToHome();
        localStorage.clear();
      }
    });

    this.msalService.instance.handleRedirectPromise().then((response) => {
      if (response) {
        this.msalService.instance.setActiveAccount(response.account);
      }
      this.getUser();
    });
  }

  onSubmit() {
   this.spinner.show();  
    if (this.t) {
      this.adminLogin.contactToken = this.t;
    } 
    this.PlacesService.loginUser(this.adminLogin).subscribe(
      (data: any) => {
        localStorage.setItem('token', data.token);
        if(data.token){
          this.navigateToHome(); 
        }
        this.spinner.hide();
      },
      (error) => { 
        this.spinner.hide();
      }
    );
  }

  private navigateToHome() {
    this.router.navigate(['/summary']);
  } 

  user: any = null;

  async waitForMsalInitialization() {
    if (!this.msalService.instance) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async loginMicrosoft() {
    try {
      // ✅ Check if an interaction is already in progress before calling loginPopup()
      if (this.msalService.instance.getActiveAccount()) {
        console.log("User already logged in.");
        return;
      }

      const response = await this.msalService.instance.loginPopup({
        scopes: ['User.Read']
      });

      this.msalService.instance.setActiveAccount(response.account);
      this.getUser();
    } catch (error) {
      if (error instanceof BrowserAuthError && error.errorCode === "interaction_in_progress") {
        console.warn("Authentication interaction already in progress.");
      } else {
        console.error("Login error:", error);
      }
    }
  }

  logoutMicrosoft() {
    this.msalService.logout();
  }

  getUser() {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.user = account;
      console.log(`user: ${this.user.name}`); 
      
    }
  }
}
