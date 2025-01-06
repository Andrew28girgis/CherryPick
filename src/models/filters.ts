export interface KayakFilters {
    ManagementOrganization: ManagementOrganization[]
    Tenants: Tenant[]
    StateCity: StateCity[]
    MinMaxBuildingSize: MinMaxBuildingSize[]
    SecondaryType: SecondaryType[]
  }
  
  export interface ManagementOrganization {
    OrganizationId: number
    Name: string
    ShoppingCenterContact: ShoppingCenterContact[]
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
  
  export class filterValues {
    statecode!: string   
    city!: string
    neighbourhood!: string
    availabilty!:boolean
    sqft!: number
    secondarytype: any
    tenants:any
    tags: any 
    managementOrganizationIds: any
    minsize!: number
    maxsize!: number
  }