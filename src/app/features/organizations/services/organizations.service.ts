import { Injectable } from '@angular/core';
import { IOrganization } from '../models/iorganization';

@Injectable({
  providedIn: 'root',
})
export class OrganizationsService {
  private organizations: IOrganization[] = [];

  constructor() {}

  setOrganizations(organizations: IOrganization[]): void {
    this.organizations = [...organizations];
  }

  getOrganizations(): IOrganization[] {
    if (this.organizations.length) return this.organizations;
    return [];
  }
}
