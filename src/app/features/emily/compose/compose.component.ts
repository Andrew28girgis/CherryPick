import { CommonModule } from '@angular/common';
import { Component, Input, input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    EditorModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './compose.component.html',
  styleUrl: './compose.component.css'
})
export class ComposeComponent {
  formGroup!: FormGroup;
  emailSubject: string = '';
  emailBodyResponse: any;
  @Input() ComposeCampaignId !:number ;
  @Input() ComposeOrgId !:number;
  @Input() ComposeContactId !:number
  
}
