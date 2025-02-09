import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/services/places.service';
import { BuyBoxOrganizationsForEmail } from 'src/models/buyboxOrganizationsForEmail';

@Component({
  selector: 'app-emily-org',
  templateUrl: './emily-org.component.html',
  styleUrls: ['./emily-org.component.css']
})
export class EmilyOrgComponent {
  buyBoxId!: number | null;
    BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private PlacesService: PlacesService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
      console.log('emily',this.buyBoxId);
      
    });
  }

  ngOnInit() {
    this.GetBuyBoxOrganizationsForEmail();
    console.log(this.buyBoxId);
  }

  GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxOrganizationsForEmail',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.BuyBoxOrganizationsForEmail = data.json;
          console.log(this.BuyBoxOrganizationsForEmail);
          
          this.spinner.hide();
        } else {
          this.BuyBoxOrganizationsForEmail = [];
          console.error('Unexpected data format:', data);
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('API error:', err);
        this.BuyBoxOrganizationsForEmail = [];
        this.spinner.hide();
      },
    });
  }

}
