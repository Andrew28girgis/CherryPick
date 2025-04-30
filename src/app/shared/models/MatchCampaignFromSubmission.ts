export interface MatchCampaignFromSubmission {
    OrganizationId: number
    OrganizationName: string
    BB: Bb[]
  }
  
  export interface Bb {
    BuyBoxId: number
    BuyBoxName: string
    MinBuildingSize: number
    MaxBuildingSize: number
    C: C[]
  }
  
  export interface C {
    CampaignId: number
    CampaignName: string
    P: P[]
  }
  
  export interface P {
    PlaceId: number
    BuildingSizeSf: number
  }