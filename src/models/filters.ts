import { Result } from "./kayak"

export interface KayakFilters {
    ManagementOrganization: ManagementOrganization[]
    Tenants: Tenant[]
    StateCity: StateCity[]
    MinMaxBuildingSize: MinMaxBuildingSize[]
    SecondaryType: SecondaryType[]
  Result?: Result[]; // Add this property

  }
  
  export interface ManagementOrganization {
    OrganizationId: number
    Name: string
    ShoppingCenterContact: ShoppingCenterContact[]
    Selected : boolean

  }
  
  export interface ShoppingCenterContact {
    ShoppingCenterId: number
    Contact: Contact[]
  }
  
  export interface Contact {
    ContactId: number
    Firstname?: string
    Lastname?: string
  }
  
  export interface Tenant {
    OrganizationId: number
    Name: string
    Summary:string
    Selected : boolean
    Branches: Branch[]
  }
  
  export interface Branch {
    ShoppingCenterId: number
  }
  
  export interface StateCity {
    CenterCity: string
    CenterState: string
  }
  
  export interface MinMaxBuildingSize {
    MinSize: number
    MaxSize: number
  }
  
  export interface SecondaryType {
    SecondaryType: string
  }
  
  export class FilterValues {
    statecode!: string;
    city!: string;
    neighbourhood!: string;
    availabilty!: boolean;
    sqft!: number;
    secondarytype!: string | null; // Assume secondary type could be a string or null
    tenants: any;
    tags!: any; // Assuming tags are stored as an array of strings
    managementOrganizationIds!: any; // Assuming IDs are an array of strings
    minsize!: number;
    maxsize!: number;
  }