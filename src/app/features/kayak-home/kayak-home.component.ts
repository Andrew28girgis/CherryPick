import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-kayak-home',
  templateUrl: './kayak-home.component.html',
  styleUrls: ['./kayak-home.component.css'],
})
export class KayakHomeComponent implements OnInit {
  organizationName: string | null = '';
  // Buyboxid: any | null = '';
  orgId!: any | null;
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.organizationName = params.get('orgName');
      this.orgId = params.get('orgId');

      // this.Buyboxid = params.get('buyboxid');
    });

    // this.breadcrumbService.setBreadcrumbs([
    //   { label: 'My Tenants', url: '/summary' },
    //   {
    //     label: `${this.BuyboxName}`,
    //     url: `dashboard/${this.Buyboxid}/${this.orgId}/${this.BuyboxName}`,
    //   },
    // ]);
  }
}
