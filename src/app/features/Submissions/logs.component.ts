import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { ActivatedRoute } from '@angular/router';
import { submission } from 'src/app/shared/models/submissions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class SubmissionsComponent implements OnInit {
  submissionsArray: submission[] = [];    
  campaignId!:any;

  constructor(private PlacesService: PlacesService,     private route: ActivatedRoute ,    private modalService: NgbModal,
  
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

  openSubmissions(content: any, modalObject?: any): void {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
  }
}
