import {
  Component,
  OnInit,
  TemplateRef,
  ChangeDetectorRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { PlacesService } from '../../../app/services/places.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, RouterModule], 
  providers: [],
  templateUrl: './tenant.component.html',
  styleUrl: './tenant.component.css',
})
export class TenantComponent implements OnInit {
  TenantResult: any = [];
  organizationBranches: any = [];
  selectedbuyBox!: string;
  buyboxid!: number;
  managementorganizationId!: number;
  buyboxDescription!: string;
  brokerlinkedin!: string;
  brokerphoto!: string;
  brokersignature!: any;
  MinBuildingSize!: number;
  MaxBuildingSize!: number;
  address!:string;
  states!:string;
  buyboxcolor!:string;
  ManagementOrganizationDesc!: string;
  buyboxname!: string;
  smalldescription: string[] = [];
  firstnamemanagerorganization!: string;
  lastnamemanagerorganization!: string;
  managementorganizationname!: string;
  ManagerOrganizationDescription!: any;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService
  ) {}
  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.selectedbuyBox = params['buyboxid'];
      this.GetBuyBoxInfo();
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

        // Use destructuring to extract values from the API response
        const buyboxData = this.TenantResult.Buybox[0].BuyBoxOrganization[0];
        const managerOrganizationData =
          buyboxData.ManagerOrganization[0].ManagerOrganizationContacts[0];

        // Assign the properties directly
        this.buyboxid = buyboxData.BuyBoxOrganizationId;
        this.buyboxDescription = buyboxData.BuyBoxOrganizationDescription;
        this.buyboxname = buyboxData.Name;
        this.firstnamemanagerorganization = managerOrganizationData.Firstname;
        this.lastnamemanagerorganization = managerOrganizationData.LastName;
        this.managementorganizationname =
          buyboxData.ManagerOrganization[0].ManagerOrganizationName;
        this.ManagerOrganizationDescription =
          buyboxData.ManagerOrganization[0].ManagerOrganizationDescription;
        this.managementorganizationId =
          buyboxData.ManagerOrganization[0].ManagerOrganizationId;
        this.brokerlinkedin = managerOrganizationData.LinkedIn;
        this.MinBuildingSize = this.TenantResult.Buybox[0].MinBuildingSize;
        this.MaxBuildingSize = this.TenantResult.Buybox[0].MaxBuildingSize;
        this.ManagementOrganizationDesc =
          buyboxData.ManagerOrganization[0].ManagerOrganizationDescription;
        this.brokerphoto = managerOrganizationData.Photo;
        this.brokersignature = managerOrganizationData.Profile;
        this.buyboxcolor = '#bd3e3e';

        this.smalldescription = Array.isArray(
          this.TenantResult.Buybox[0].Description
        )
          ? this.TenantResult.Buybox[0].Description
          : [this.TenantResult.Buybox[0].Description];

        this.spinner.hide();
        console.log('Extracted BuyBoxOrganizationId:', this.buyboxid);

        this.GetOrganizationBranches();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.spinner.hide();
      },
    });
  }

  GetOrganizationBranches(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetOrganizationBranches',
      Params: {
        organizationid: this.buyboxid, 
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        console.log('GetOrganizationBranches API Response:', res);
        this.organizationBranches = res.json[0];
        this.address=this.organizationBranches.Address;
        this.states=this.organizationBranches.States;
        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.spinner.hide();
      },
    });
  }
}
