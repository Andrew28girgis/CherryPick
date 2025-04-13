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
  tabs = [
    {
      id: 'Properties',
      label: 'Properties',
      icon: '../../../assets/icons/svgs/properties.svg',
      selectedIcon: '../../../assets/icons/svgs/properties-selected.svg',
    },
    {
      id: 'Market Survery',
      label: 'Market Survery',
      icon: '../../../assets/icons/svgs/details.svg',
      selectedIcon: '../../../assets/icons/svgs/details-selected.svg',
    },
    // {
    //   id: 'Emily',
    //   label: 'Emily',
    //   icon: '../../../assets/icons/svgs/emily.svg',
    //   selectedIcon: '../../../assets/icons/svgs/emily-selected.svg',
    // },
  ];
  activeComponent: string = 'Properties';
  selectedTab: string = 'Properties';
  BuyboxName: string | null = '';
  Buyboxid: any | null = '';
  orgId!: any | null;
  constructor(
    public router: Router,
    private _location: Location,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.BuyboxName = params.get('buyboxName');
      this.orgId = params.get('orgId');

      this.Buyboxid = params.get('buyboxid');
      console.log(`organization id is ${this.orgId}`);
    });
    this.activeComponent = 'Properties';
    this.selectedTab = 'Properties';

    this.breadcrumbService.setBreadcrumbs([
      { label: 'My Tenants', url: '/summary' },
      { 
        label: `${this.BuyboxName}-Dashboard`, 
        url: `dashboard/${this.Buyboxid}/${this.orgId}/${this.BuyboxName}`
      }
    ]);
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
    this.activeComponent = tabId;
  }

  BackTo() {
    this._location.back();
  }
}
