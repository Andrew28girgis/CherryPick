import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/shared/services/places.service';
import { General, adminLogin } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/shared/services/config.service';
import { AuthService } from 'src/app/shared/services/auth.service';

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
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    localStorage.removeItem('mapView');
  }

  async ngOnInit() {
    this.General = new General();
    this.adminLogin = new adminLogin();
    this.logoUrl = this.configService.getLogoUrl();
    // First check if user is already logged in today
    // if (this.authService.isLoggedInToday()) {
    //   console.log(`hello`);

    //   this.navigateToHome();
    //   return;
    // }
    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.t = params.get('t');
      if (this.t) {
        localStorage.clear();
        this.loginWithGUID();
      } else {
        localStorage.clear();
      }
    });
  }

  loginWithGUID() {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxIdToBeShown',
      Params: {
        BuyBoxGUID: this.t,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => { 
        data.json.buyBoxId
       this.spinner.hide();
      }
    });
 
  }

  onSubmit() {
    this.spinner.show();
    if (this.t) {
      this.adminLogin.contactToken = this.t;
    }
    this.PlacesService.loginUser(this.adminLogin).subscribe((data: any) => {
      localStorage.setItem(
        'accountMicrosoftLinked',
        data.accountMicrosoftLinked
      );
      // Use the updated auth service to store the token with date
      this.authService.setToken(data.token);
      localStorage.setItem('contactId', data.contactId);
      localStorage.setItem('orgId', data.orgId);
      if (data.token) {
        this.navigateToHome();
      }
      this.spinner.hide();
    });
  }

  private navigateToHome() {
    this.router.navigate(['/dashboard']);
  }
}
