import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { IBuyboxDetails } from '../../models/ibuybox-details';
import { Generated, RelationNames } from 'src/app/shared/models/emailGenerate';

@Component({
  selector: 'app-generate-email',
  templateUrl: './generate-email.component.html',
  styleUrl: './generate-email.component.css',
})
export class GenerateEmailComponent implements OnInit {
  buyboxDetails!: IBuyboxDetails;
  showMinBuildingSize: boolean = true;
  showBuyBoxDescriptionDetails: boolean = true;
  BuyBoxOrganizationName: string = '';
  showBuyBoxDescription: boolean = true;
  generated!: Generated[] ;
  showRelationNames: boolean = true;
  ShowCompetitors: boolean = true;
  ShowComplementaries: boolean = true;
  relationCategoriesNames: RelationNames[] = [];
  showMoreRelations: { [key: number]: boolean } = {};
  ManagerOrganizationName: string = '';
  showOrganizationManagers: boolean = true;
  showMangerDescriptionDetails: boolean = true;
  
  @Input() buyBoxId!: number;
  constructor(
    private placeService: PlacesService,
  ) {}

  ngOnInit(): void {




    this.GetBuyBoxDetails();
    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
  }

  GetBuyBoxDetails() {
    const body = {
      Name: 'GetWizardBuyBoxesById',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (response: any) => {
        if (response.json) {
          this.buyboxDetails = response.json;
        }
      },
    });
  }

  GetBuyBoxInfo() {
    const body: any = {
      Name: 'GetBuyBoxInfo',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    this.placeService.GenericAPI(body).subscribe({
      next: (data) => {
        this.generated = data.json || [];

        this.ManagerOrganizationName =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationName;
        this.BuyBoxOrganizationName =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.Name;

        const buyBox = this.generated?.[0]?.Buybox?.[0];
        if (buyBox) {
          this.ManagerOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
              ?.ManagerOrganizationName || '';
          this.BuyBoxOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.Name || '';
        }

        // Extract Shopping Centers safely

        this.generated?.[0]?.Releations?.forEach((r) => {
          r.relationSelect = true;
        });
      },
    });
  }

  toggleRelationNames(event: any) {
    this.showRelationNames = event.target.checked;
    if (this.showRelationNames == true) {
      this.ShowCompetitors = true;
      this.ShowComplementaries = true;
    } else {
      this.ShowCompetitors = false;
      this.ShowComplementaries = false;
    }
  }

  getRelationsForCategory(categoryId: number) {
    if (
      !this.generated ||
      this.generated.length === 0 ||
      !this.generated[0].Releations
    ) {
      return [];
    }
    return this.generated[0].Releations.filter(
      (item) => item.RetailRelationCategoryId === categoryId
    );
  }

  getVisibleRelations(categoryId: number) {
    const relations = this.getRelationsForCategory(categoryId);
    return this.showMoreRelations[categoryId]
      ? relations
      : relations.slice(0, 3);
  }

  toggleShowMore(categoryId: number) {
    this.showMoreRelations[categoryId] = !this.showMoreRelations[categoryId];
  }

  toggleManagerDesc(event: any) {
    this.showOrganizationManagers = event.target.checked;
    if (this.showOrganizationManagers == true) {
      this.showMangerDescriptionDetails = true;
    } else {
      this.showMangerDescriptionDetails = false;
    }
  }

  GetRetailRelationCategories() {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        buyboxid: this.buyBoxId,
      },
    };
    this.placeService.GenericAPI(body).subscribe({
      next: (data) => {
        this.relationCategoriesNames = data.json;
        this.relationCategoriesNames?.forEach((r) => (r.selected = true));
      },
    });
  }
}
