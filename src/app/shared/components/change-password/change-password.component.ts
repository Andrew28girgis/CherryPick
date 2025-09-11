import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPassword, General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [NgxSpinnerModule, FormsModule, RouterModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  public ResetPassword!: ResetPassword;
  public general: General = new General();
  public confirmPassword: string = '';
  public errorMessage: string = '';
  public successMessage: string = '';
  public showNewPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  public fadeSuccess: boolean = false;
  public fadeError: boolean = false;
  private key = CryptoJS.enc.Utf8.parse('YourSecretKey123YourSecretKey123');
  private iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    private readonly spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.ResetPassword = new ResetPassword();

    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email && token) {
      this.ResetPassword.Email = email;
      this.ResetPassword.Token = token;
    }
  }

  public onSubmit(): void {
    if (this.ResetPassword.NewPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.successMessage = '';
      this.fadeError = true;
      setTimeout(() => (this.fadeError = false), 4000);
      return;
    }

    if (
      !this.ResetPassword.Email ||
      !this.ResetPassword.NewPassword ||
      !this.ResetPassword.Token
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      this.successMessage = '';
      this.fadeError = true;
      setTimeout(() => (this.fadeError = false), 4000);
      return;
    }

    this.spinner.show();
    this.errorMessage = '';
    this.successMessage = '';

    const payload: ResetPassword = {
      Email: this.ResetPassword.Email,
      NewPassword: this.encrypt(this.ResetPassword.NewPassword),
      Token: this.ResetPassword.Token,
    };


    this.placesService.ResetPassword(payload).subscribe({
      next: (res: any) => {

        if (res.message === 'Password has been reset successfully.') {
          this.successMessage = 'Password has been reset successfully!';
          this.fadeSuccess = true;

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage = 'Password change failed. Please try again.';
          this.fadeError = true;
          setTimeout(() => (this.fadeError = false), 4000);
        }

        this.spinner.hide();
      },
      error: (err) => {
        console.error('API error:', err);
        this.errorMessage = 'An error occurred. Please try again.';
        this.fadeError = true;
        setTimeout(() => (this.fadeError = false), 4000);
        this.spinner.hide();
      },
    });
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
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
