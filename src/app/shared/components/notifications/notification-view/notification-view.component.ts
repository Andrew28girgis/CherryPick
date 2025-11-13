import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-notification-view',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './notification-view.component.html',
  styleUrls: ['./notification-view.component.css'],
})
export class NotificationViewComponent implements OnInit {
  notificationViewId!: number;
  htmlData: SafeHtml = '';
  titleName: string = '';
  public showSaveToast = false;
  public isSaving = false;
  constructor(
    public activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private cdRef: ChangeDetectorRef,
    private refreshService: RefreshService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: any) => {
      this.notificationViewId = params['id'];
      if (this.notificationViewId) {
        this.GetNotificationHTML();
      }
    });
  }
  GetNotificationHTML() {
    this.spinner.show();
    const body: any = {
      Name: 'GetNotificationHTML',
      MainEntity: null,
      Params: {
        Id: this.notificationViewId,
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json) {
          this.htmlData = this.sanitizer.bypassSecurityTrustHtml(
            data.json[0].html
          );
          console.log(this.htmlData);

          this.spinner.hide();
        } else {
          this.htmlData = 'No HTML Data Found';
          this.spinner.hide();
        }
        this.spinner.hide();
      },
    });
  }

  saveTitleInNotification(): void {
    this.isSaving = true;

    const request = {
      Name: 'SetTitleInNotification',
      Params: {
        Id: this.notificationViewId,
        Title: this.titleName.trim(),
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: () => {
        this.showSaveToast = true;
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.showSaveToast = false;
          this.cdRef.detectChanges();
        }, 2500);
        this.refreshService.triggerRefreshOrganizations();

        this.isSaving = false;
        this.titleName = '';
      },
    });
  }
}
