import {
  Component,
  OnInit,
  TemplateRef,
  ChangeDetectorRef,
  ViewChild,
  HostListener,
} from '@angular/core';import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { PlacesService } from '../../../app/services/places.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';  // Import RouterModule

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],  // Add CommonModule and NgxSpinnerModule to the imports array
  providers:[],
  templateUrl: './tenant.component.html',
  styleUrl: './tenant.component.css',
})
export class TenantComponent implements OnInit  {
  TenantResult: any = [];  
  organizationBranches: any = []; 
  selectedbuyBox!: string;
  buyboxid!:number;
  managementorganizationId!:number;
  buyboxDescription!:string;
  brokerlinkedin!:string;
  brokerphoto!:string;
  brokersignature!:any;
  MinBuildingSize!:number;
  MaxBuildingSize!:number;
  ManagementOrganizationDesc!:string;
  buyboxname!:string;
  smalldescription: string[] = []; 
  firstnamemanagerorganization!:string;
  lastnamemanagerorganization!:string;
  managementorganizationname!:string;
  ManagerOrganizationDescription!:any;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService
  ) {}
  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
      console.log(this.selectedbuyBox);
      this.GetBuyBoxInfo();
      this.GetOrganizationBranches();
    });
  }
  GetBuyBoxInfo(): void {
    this.spinner.show(); // Show the spinner before the API request

    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.selectedbuyBox,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.TenantResult = res.json[0];  
        console.log('API Response:', this.TenantResult);
        this.buyboxid=this.TenantResult.Buybox[0].BuyBoxOrganization[0].BuyBoxOrganizationId;;
        this.buyboxDescription = this.TenantResult.Buybox[0].BuyBoxOrganization[0].BuyBoxOrganizationDescription;
        this.buyboxname = this.TenantResult.Buybox[0].BuyBoxOrganization[0].Name;
        this.firstnamemanagerorganization=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationContacts[0].Firstname;
        this.lastnamemanagerorganization=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationContacts[0].LastName;
        this.managementorganizationname=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationName
        this.ManagerOrganizationDescription=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationDescription
        this.managementorganizationId=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationId;
        this.brokerlinkedin=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationContacts[0].LinkedIn;
        this.MinBuildingSize=this.TenantResult.Buybox[0].MinBuildingSize;
        this.MaxBuildingSize=this.TenantResult.Buybox[0].MaxBuildingSize
        this.ManagementOrganizationDesc=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationDescription;
        this.brokerphoto=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationContacts[0].Photo;
        this.brokersignature=this.TenantResult.Buybox[0].BuyBoxOrganization[0].ManagerOrganization[0].ManagerOrganizationContacts[0].Profile;

        if (Array.isArray(this.TenantResult.Buybox[0].Description)) {
          this.smalldescription = this.TenantResult.Buybox[0].Description; // Assuming Description is an array
        } else {
          this.smalldescription = [this.TenantResult.Buybox[0].Description];
        }

        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.spinner.hide();
      },
    });
  }
  GetOrganizationBranches(): void {
    // Log the organizationid to the console
    console.log('Organization ID:', this.buyboxid); // This logs the value of organizationid
  
    this.spinner.show(); // Show the spinner before the API request
  
    const body: any = {
      Name: 'GetOrganizationBranches',
      Params: {
        organizationid: this.buyboxid, // Pass the OrganizationId parameter
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        console.log('GetOrganizationBranches API Response:', res);
        
        // Handle the response here, e.g., store it in a variable
        this.organizationBranches = res.json; // You can process it as needed
  
        // Hide the spinner once the data is fetched
        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        
        // Hide the spinner in case of an error
        this.spinner.hide();
      },
    });
  }
  
  
}
