export interface PropertiesDetails {
    Id: number
    CenterName: string
    CenterAddress: string
    CenterCity: string
    CenterState: string
    ZipCode: string
    Images: string
    Availability: Availability[]
    Tenants: Tenant[]
  }
  
  export interface Availability {
    Id: number
    BuildingSizeSf: number
  }
  
  export interface Tenant {
    Id: number
    Name: string
    URL: string
  }