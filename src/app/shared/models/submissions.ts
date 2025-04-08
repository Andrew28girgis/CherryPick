export interface submission {
  Id: number
  Name: string
  Description: string
  ComparableTypeId: number
  MinBuildingSize: number
  MaxBuildingSize: number
  OrganizationId: number
  ManagerOrganizationId: number
  ManagerContactId: number
  Campaigns: Campaign[]
}

export interface Campaign {
  Id: number
  CampaignName: string
  BuyBoxId: number
  CampaignPrivacy: number
  CreatedDate: string
  ShoppingCenters: ShoppingCenter[]
}

export interface ShoppingCenter {
  CenterName: string
  UserName: string
  UserSubmissions: UserSubmission[]
  Places:Places[] 
  CenterAddress: string
  CenterCity: string
  CenterState: string
  MainImage: string
  C: User[];
}

export interface User {
  FirstName: string;
  LastName: string;
  UserSubmissions: UserSubmission[];
}

export interface UserSubmission {
  Id: number
  UserId: number
  ShoppingCenterId: number
  CreatedDate: string
  CampaignId: number
  StatusId: number
  SourceId: number
}

export interface Places {
  BuildingSizeSf: number
  ForLeasePrice: number
}