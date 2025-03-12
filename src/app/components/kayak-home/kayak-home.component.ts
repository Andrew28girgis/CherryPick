import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

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
      id: 'Details',
      label: 'Details',
      icon: '../../../assets/icons/svgs/details.svg',
      selectedIcon: '../../../assets/icons/svgs/details-selected.svg',
    },
    {
      id: 'Emily',
      label: 'Emily',
      icon: '../../../assets/icons/svgs/emily.svg',
      selectedIcon: '../../../assets/icons/svgs/emily-selected.svg',
    },
  ];
  activeComponent: string = 'Properties';
  selectedTab: string = 'Properties';
  BuyboxName: string | null = '';
  Buyboxid: any | null = '';

  constructor(
    public router: Router,
    private _location: Location,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.BuyboxName = params.get('buyboxName');
      this.Buyboxid = params.get('buyboxid');
    });
    this.activeComponent = 'Properties';
    this.selectedTab = 'Properties';
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
    this.activeComponent = tabId;
  }

  BackTo() {
    this._location.back();
  }
}
