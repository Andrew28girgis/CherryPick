import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General, adminLogin } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { Title } from '@angular/platform-browser';
import { ConfigService } from 'src/app/services/config.service';

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
  t:any;
  r:any ;
  private afterLoginRedirect: string | null = null;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private configService: ConfigService,
  ) {
    localStorage.removeItem('mapView'); 
  }

  ngOnInit(): void {
    this.General = new General();
    this.adminLogin = new adminLogin();
    this.logoUrl = this.configService.getLogoUrl(); 
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.t = params.get('t');
      this.r = params.get('r');  
      if (this.t && this.r) { 
          this.onSubmit()
      }
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
      this.spinner.hide();

      if (this.r) {
        // If 'r' is something like '/landing/723223/165/84'
        this.router.navigateByUrl(this.r);
      } else {
        this.navigateToHome();
      }
    },
    (error) => {
      this.handleError(error.error);
      this.spinner.hide();
    }
  );
}


  private navigateToHome() {
    this.router.navigate(['/summary']);
    //this.router.navigate(['/CherryPickExpansion']);
  }

  private handleError(error: any) {
    console.error('An error occurred during login:', error);
  }
  
}
