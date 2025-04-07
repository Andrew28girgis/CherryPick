import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { General, adminLogin } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { ConfigService } from 'src/app/core/services/config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
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

  ngOnInit() {
    this.General = new General();
    this.adminLogin = new adminLogin();
    this.logoUrl = this.configService.getLogoUrl();
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
        localStorage.setItem('orgId', data.json.organizationId);
        let buybBoxId = data.json[0].buyBoxId;
        let organizationId = data.json[0].organizationId;
        let buyboxName = data.json[0].name;
        this.router.navigate(['/home', buybBoxId, organizationId, buyboxName]);
        this.spinner.hide();
      },
    });
  }

  onSubmit() {
     if (this.t) {
      this.adminLogin.contactToken = this.t;
    }
    this.PlacesService.loginUser(this.adminLogin).subscribe((data: any) => {
      localStorage.setItem(
        'accountMicrosoftLinked',
        data.accountMicrosoftLinked
      );
      this.authService.setToken(data.token);
      localStorage.setItem('contactId', data.contactId);
      localStorage.setItem('orgId', data.orgId);
      if (data.token) {
        this.navigateToHome();
      }
     });
  }

  private navigateToHome() {
    this.router.navigate(['/tasks']);
  }
}
