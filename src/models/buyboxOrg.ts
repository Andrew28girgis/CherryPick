export interface BuyboxOrg {
  Id: number;
  Name: string;
  Description: string;
  ComparableTypeId: number;
  OrganizationId: number;
  ManagerOrganizationId: number;
  Organization: Organization[];
}

export interface Organization {
  ID: number;
  Name: string;
  LogoURL: string;
  Branches: Branch[];
}

export interface Branch {}
