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

  places:IIPlace[] = [];
  openSubmissions(content: any, modalObject?: any): void {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.places = modalObject.UserSubmissions[0].ShoppingCenters[0].Place;
    // this.General.modalObject = modalObject;
    console.log(`ww`);
    console.log(this.places);
    
    
  }

  getSubmissionCenterName(submission: submission) {
    return submission.UserSubmissions[0].ShoppingCenters[0].CenterName;
  }
  getSubmissionCenter(submission: submission) {
    return submission.UserSubmissions[0].ShoppingCenters[0];
  }

  getSubmissionCenterAddress(submission: submission) {
    return (
      submission.UserSubmissions[0].ShoppingCenters[0].CenterCity +
      ', ' +
      submission.UserSubmissions[0].ShoppingCenters[0].CenterState
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

  acceptSubmission(submission: submission): void {
    submission.UserSubmissions[0].StatusId = 1;
    console.log(`Submission ${submission.Firstname} accepted!`);
  }
  
  rejectSubmission(submission: submission): void {
    submission.UserSubmissions[0].StatusId = -1;
    console.log(`Submission ${submission.Firstname} rejected!`);
  }


  AcceptUserSubmission(submission: submission): void {
    submission.UserSubmissions[0].StatusId = 1;
  
    const userSubmissionId = submission.UserSubmissions[0].Id; 
    
    const body: any = {
      Name: 'AcceptUserSubmission',
      Params: {
        UserSubmissionId: userSubmissionId,
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.fetchReceivedSubmissions(); 
      }
    });
  }
  
  RejectUsersubmission(submission: submission): void {
    submission.UserSubmissions[0].StatusId = -1;
  
    const userSubmissionId = submission.UserSubmissions[0].Id;  
    
    const body: any = {
      Name: 'RejectUsersubmission',
      Params: {
        UserSubmissionId: userSubmissionId, 
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.fetchReceivedSubmissions(); 
      }
    });
  }
  
  
}
