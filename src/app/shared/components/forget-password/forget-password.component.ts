import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPassword, General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [NgxSpinnerModule, FormsModule, RouterModule, CommonModule],
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css'],
})
export class ForgetPasswordComponent implements OnInit {
  public fadeSuccess: boolean = false;
  public fadeError: boolean = false;
  public forgetPassword!: ForgotPassword;
  public general: General = new General();
  public Message: string = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    private readonly spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.forgetPassword = new ForgotPassword();
  }

  public onSubmit(): void {
    if (!this.forgetPassword.Email) {
      this.Message = '';
      this.fadeError = false;

      setTimeout(() => {
        this.fadeError = true;
      }, 3000); 

      return;
    }

    this.spinner.show();
    this.Message = '';
    this.fadeSuccess = false;

    const payload: ForgotPassword = {
      Email: this.forgetPassword.Email,
    };

    this.placesService.ForgotPassword(payload).subscribe({
      next: (res: any) => {

        this.Message = 'Password Reset Link is sent to this Email!';
        this.spinner.hide();

        setTimeout(() => {
          this.fadeSuccess = true;
        }, 3000);

        setTimeout(() => {
          this.Message = '';
          this.fadeSuccess = false;
        }, 4000); 
      }
    });
  }
}
