export interface ICampaign {
  Id: number;
  CampaignName: string;
  BuyBoxId: number;
  CampaignPrivacy: number;
  BuyBoxes: BuyBox[];
}

export interface BuyBox {
  Id: number;
  Name: string;
  MinBuildingSize: number;
  MaxBuildingSize: number;
  OrganizationId: number;
  BaseRent: number;
  BuildingSquareFootage: number;
  BuildingType: string;
  CeilingHeight: number;
  DealStructure: string;
  DriveThru: boolean;
  FloodZone: string;
  FrontageLength: number;
  HistoricDistrict: string;
  LeaseTerm: string;
  LotSize: number;
  NNNCharges: number;
  OtherComments: string;
  OvernightBoardingPermitted: boolean;
  ParkingSpaces: number;
  PropertyCondition: string;
  PurchasePrice: number;
  Restrictions: string;
  ServiceAccess: string;
  TIAllowance: number;
  TrafficDrection: string;
  VehiclePerDay: number;
  Zoning: string;
  BuyBoxContacts: BuyBoxContact[];
}

export interface BuyBoxContact {
  Id: number;
  BuyBoxId: number;
  ContactId: number;
}
