import { Result } from "./kayak";

export interface KayakFilters {
  ManagementOrganization: ManagementOrganization[];
  Tenants: Tenant[];
  Neighbourhood: Neighbourhood[];
  StateCity: StateCity[];
  MinMaxBuildingSize: MinMaxBuildingSize[];
  SecondaryType: SecondaryType[];
  TenantsCategories: TenantsCategories[];
  Result?: Result[];
}

export interface ManagementOrganization {
  OrganizationId: number;
  Name: string;
  ShoppingCenterContact: ShoppingCenterContact[];
  Selected?: boolean;
}

export interface ShoppingCenterContact {
  ShoppingCenterId: number;
  Contact: Contact[];
}

export interface Contact {
  ContactId: number;
  Firstname?: string;
  Lastname?: string;
}

export interface TenantsCategories {
  TenantsCategoriesId: number;
  Name: string;
  ChildCategory: ChildCategory[];
  Selected?: boolean;
}

export interface ChildCategory {
  ChildCategoryId?: number;
  ChildCategoryName?: string;
  ChildCategory?: Category[];
}

export interface Category {
  Id: number;
  Name?: string;
  ParentId?: number;
}

export interface Tenant {
  OrganizationId: number;
  Name: string;
  Summary: string;
  Selected?: boolean;
  Branches: Branch[];
}

export interface Branch {
  ShoppingCenterId: number;
}

export interface Neighbourhood {
  Neighbourhood?: string;
}

export interface StateCity {
  CenterCity: string;
  CenterState: string;
}

export interface MinMaxBuildingSize {
  MinSize: number;
  MaxSize: number;
}

export interface SecondaryType {
  SecondaryType: string;
}

export class FilterValues {
  statecode!: string;
  city!: string;
  neighbourhood!: string;
  availabilty!: boolean;
  sqft!: number;
  secondarytype!: string | null;
  tenants!: any;
  tags!: any;
  managementOrganizationIds!: any;
  minsize!: number;
  maxsize!: number;
  tenantCategory!: string;
}