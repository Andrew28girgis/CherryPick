import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
PlacesService
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class SubmissionsComponent implements OnInit {
  submissionsArray: any[] = [];
  centername!: string;
  CreatedDate!: string;
  FileName!: string;
  UserName!: string;
  constructor(private PlacesService: PlacesService, private eRef: ElementRef) {}

  ngOnInit(): void {
    this.fetchReceivedSubmissions();
  }

  fetchReceivedSubmissions(): void {
    const body: any = {
      Name: 'fetchReceivedSubmissions',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.submissionsArray = res.json || [];
        this.centername = this.submissionsArray[0].CenterName;
        this.CreatedDate = this.submissionsArray[0].US[0].CreatedDate;
        this.FileName = this.submissionsArray[0].US[0].FileName;
        this.UserName = this.submissionsArray[0].UserName;
      },
    });
  }
}
