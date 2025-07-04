import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-add-campaign',
  templateUrl: './add-campaign.component.html',
  styleUrl: './add-campaign.component.css',
})
export class AddCampaignComponent implements OnInit {
  protected userBuyBoxes!: { id: number; name: string }[];

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Campaigns', url: '/campaigns' },
      { label: 'Add Campaign', url: '/add-campaign' },
    ]);
    this.getUserBuyBoxes();
  }

  getUserBuyBoxes(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        this.spinner.hide();
        if (response.json && response.json.length > 0) {
          this.userBuyBoxes = response.json.map((buybox: any) => {
            return {
              id: buybox.id,
              name: buybox.name,
            };
          });
        } else {
          this.userBuyBoxes = [];
        }
      },
    });
  }
}
