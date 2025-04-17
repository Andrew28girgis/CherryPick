import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { ActivatedRoute } from '@angular/router';
import { submission, Places } from 'src/app/shared/models/submissions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/app/shared/models/domain';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class SubmissionsComponent implements OnInit {
  submissionsArray: submission[] = [];
  campaignId!: any;
  General!: General;
  places: Places[] = [];
  @ViewChild('AddNote', { static: true }) AddNote!: TemplateRef<any>;
  Notes: string = '';
  SubmID!: number;
  contactID!: any;
  acceptedSubmissions: number = 0;
  rejectedSubmissions: number = 0;
  constructor(
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.campaignId = params.get('campaignId');
    });
    this.breadcrumbService.addBreadcrumb({
      label: 'Submissions',
      url: `/campaigns/${this.campaignId}`,
    });

    this.contactID = localStorage.getItem('contactId');
    this.fetchReceivedSubmissions();
  }

  fetchReceivedSubmissions(): void {
    const body: any = {
      Name: 'fetchReceivedSubmissions',
      Params: {
        CampaignID: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.submissionsArray = res.json || [];
        let acceptedCount = 0;
        let rejectedCount = 0;

        if (this.submissionsArray.length) {
          const campaigns = this.submissionsArray[0].Campaigns || [];
          campaigns.forEach((campaign: any) => {
            const shoppingCenters = campaign.ShoppingCenters || [];
            shoppingCenters.forEach((center: any) => {
              const users = center.C || [];
              users.forEach((user: any) => {
                const submissions = user.UserSubmissions || [];
                submissions.forEach((submission: any) => {
                  if (submission.StatusId === 1) {
                    acceptedCount++;
                  } else if (submission.StatusId === -1) {
                    rejectedCount++;
                  }
                });
              });
            });
          });
        }
        this.acceptedSubmissions = acceptedCount;
        this.rejectedSubmissions = rejectedCount;
      },
    });
  }

  openPlaces(content: any, scPlaces: any): void {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.places = scPlaces;
  }

  getSubmissionCenterName(userSubmission: any) {
    return userSubmission.ShoppingCenters[0].CenterName;
  }

  getSubmissionCenterAddress(userSubmission: any) {
    return (
      userSubmission.ShoppingCenters[0].CenterCity +
      ', ' +
      userSubmission.ShoppingCenters[0].CenterState
    );
  }

  // getSubmissionSourceId(submission: submission) {
  //   if (submission.UserSubmissions[0].SourceId == 1) {
  //     return 'Landing Page';
  //   } else if (submission.UserSubmissions[0].SourceId == 2) {
  //     return 'Email';
  //   } else {
  //     return 'Internal';
  //   }
  // }

  AcceptUserSubmission(userSubmission: any): void {
    userSubmission.StatusId = 1;
    const userSubmissionId = userSubmission.Id;
    const body: any = {
      Name: 'AcceptUserSubmission',
      Params: {
        UserSubmissionId: userSubmissionId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.fetchReceivedSubmissions();
      },
    });
  }

  RejectUsersubmission(userSubmission: any): void {
    userSubmission.StatusId = -1;
    const userSubmissionId = userSubmission.Id;
    const body: any = {
      Name: 'RejectUsersubmission',
      Params: {
        UserSubmissionId: userSubmissionId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.fetchReceivedSubmissions();
      },
    });
  }
  openAddNoteModal(SubmissionId: number) {
    this.modalService.open(this.AddNote, { size: 'xl', centered: true });
    this.SubmID = SubmissionId;
  }
  InsertTenantNotes() {
    this.spinner.show();
    const body: any = {
      Name: 'InsertTenantNotes',
      MainEntity: null,
      Params: {
        ContactId: Number(this.contactID),
        SubmissionId: this.SubmID,
        Notes: this.Notes,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {},
    });
    this.modalService.dismissAll();
    this.spinner.hide();
    this.Notes = '';
    this.fetchReceivedSubmissions();
  }
  getProgressColor(percentage: number): string {
    if (percentage > 75) {
      return '#28A745'; // Green for above 80%
    } else if (percentage >= 50) {
      return '#ffc107'; // Yellow for between 50% and 80%
    } else {
      return '#FF4C4C'; // Red for below 50%
    }
  }
}
