import { Component, OnInit } from '@angular/core';
import { IOrganization } from '../../models/iorganization';
import { PlacesService } from 'src/app/core/services/places.service';
import { OrganizationsService } from '../../services/organizations.service';
import { IPageEvent } from 'src/app/shared/interfaces/ipage-event';

@Component({
  selector: 'app-organizations-list',
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.css',
})
export class OrganizationsListComponent implements OnInit {
  protected first: number = 0;
  protected rows: number = 20;
  protected organizations: IOrganization[] = [];
  protected paginatedOrganizations: IOrganization[] = [];
  protected dataLoaded: boolean = false;

  constructor(
    private placeService: PlacesService,
    private organizationsService: OrganizationsService
  ) {}

  ngOnInit(): void {
    this.getAllOrganizations();
  }

  protected getAllOrganizations(): void {
    const organizations = this.organizationsService.getOrganizations();
    if (organizations.length) {
      this.organizations = [...organizations];
      this.paginatedOrganizations = this.organizations.slice(
        this.first,
        this.first + this.rows
      );
      this.dataLoaded = true;
      return;
    }

    const body = {
      Name: 'GetAllOrganizations',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      this.dataLoaded = true;
      if (response.json && response.json.length) {
        this.organizations = response.json;
        this.paginatedOrganizations = this.organizations.slice(
          this.first,
          this.first + this.rows
        );
        this.organizationsService.setOrganizations(response.json);
      }
    });
  }

  onPageChange(event: IPageEvent) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;

    this.paginatedOrganizations = this.organizations.slice(
      this.first,
      this.first + this.rows
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
