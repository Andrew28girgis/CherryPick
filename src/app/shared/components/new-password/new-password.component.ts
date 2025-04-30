import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangePassword, General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [NgxSpinnerModule, FormsModule, RouterModule, CommonModule],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css',
})
export class NewPasswordComponent {
  public ChangePassword!: ChangePassword;
  public general: General = new General();
  public confirmPassword: string = '';
  public errorMessage: string = '';
  public successMessage: string = '';
  public showNewPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  public fadeSuccess: boolean = false;
  public fadeError: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly placesService: PlacesService,
    private readonly spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.ChangePassword = new ChangePassword();
  }

  public onSubmit(): void {
    if (this.ChangePassword.NewPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.successMessage = '';
      this.fadeError = true;
      setTimeout(() => this.fadeError = false, 4000); 
      return;
    }
    this.spinner.show();
    this.errorMessage = '';
    this.successMessage = '';

    const payload: ChangePassword = {
      Email: this.ChangePassword.Email,
      OldPassword: this.ChangePassword.OldPassword,
      NewPassword: this.ChangePassword.NewPassword,
    };

    console.log('Sending payload:', payload);

    this.placesService.ChangePassword(payload).subscribe({
      next: (res: any) => {
        console.log('Reset password response:', res);
        if (res.message === 'Password has been reset successfully.') {
          this.successMessage = 'Password has been reset successfully!';
          this.fadeSuccess = true;
          this.router.navigate(['/summary']);
        } else {
          this.errorMessage = 'Password change failed. Please try again.';
          this.fadeError = true;
          setTimeout(() => this.fadeError = false, 4000);
        }

        this.spinner.hide();
      },
      error: (err) => {
        console.error('API error:', err);
        this.errorMessage = 'An error occurred. Please try again.';
        this.fadeError = true;
        setTimeout(() => this.fadeError = false, 4000);
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
}
