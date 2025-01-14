export interface KayakResult {
    Ids: string
    ManagementOrganizations:ManagementOrganizations[]
    Result: Result[]
  }
  export interface ManagementOrganizations {
    ShoppingCenterContact: ShoppingCenterContact[]
  }
  
  export interface ShoppingCenterContact {
    ShoppingCenterId: number
  }
  
  export interface Result {
    Id: number;
    CenterName: string;
    CenterAddress: string;
    CenterCity: string;
    CenterState: string;
    Images: string | null; // Images can be null or a comma-separated string
    Latitude?: number; // Optional, since it might not always exist
    Longitude?: number; // Optional, since it might not always exist
    StreetLatitude?: number;
    StreetLongitude?: number;
    place?: Place[]; // If `place` exists, define it as an array of Place
  }
  
  export interface Place {
    Id?: number
    BuildingSizeSf?: number
    Suite?: string
    ForLeasePrice?: number
  }
    export interface StatesAndCities {
      stateCode: string
      city: string
    }