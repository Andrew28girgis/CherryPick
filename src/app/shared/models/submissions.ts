export interface submission {
    id: number
    Firstname: string
    Lastname: string
    UserSubmissions: UserSubmission[]
  }
  
  export interface UserSubmission {
    Id: number
    UserId: number
    ShoppingCenterId: number
    FileName: string
    CreatedDate: string
    CampaignId: number
    ShoppingCenters: ShoppingCenter[]
  }
  
  export interface ShoppingCenter {
    id: number
    CenterName: string
    CenterCity: string
    CenterState: string
    Place: Place[]
  }
  
  export interface Place {
    BuildingSizeSf?: number
    ForLeasePrice?: number
    LeaseType?: string
    Suite?: string
  }
  