import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { ActivatedRoute } from '@angular/router';
import { IIPlace, submission } from 'src/app/shared/models/submissions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/app/shared/models/domain';
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class SubmissionsComponent implements OnInit {
  submissionsArray: submission[] = [];
  campaignId!: any;
  General!: General;
  places:IIPlace[] = [];

  constructor(
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.campaignId = params.get('campaignId');
      console.log(this.campaignId);
    });

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
      },
    });
  }

  openSubmissions(content: any, userSubmission: any): void {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.places = userSubmission.ShoppingCenters[0].Place;
    console.log(this.places);
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

  getSubmissionSourceId(submission: submission) {
    if (submission.UserSubmissions[0].SourceId == 1) {
      return 'Landing Page';
    } else if (submission.UserSubmissions[0].SourceId == 2) {
      return 'Email';
    } else {
      return 'Internal';
    }
  }

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
}