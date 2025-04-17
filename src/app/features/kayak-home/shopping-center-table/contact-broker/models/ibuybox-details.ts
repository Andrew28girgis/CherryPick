export interface IBuyboxDetails {
  Id: number;
  Name: string;
  Description: string;
  FPOId: any;
  ComparableTypeId: number;
  MinBuildingSize: number;
  MaxBuildingSize: number;
  MinLandSize: any;
  MaxLandSize: any;
  AcquisitionTypeId: any;
  EmptyLand: any;
  MinBuildingUnits: any;
  MaxBuildingUnits: any;
  OrganizationId: number;
  ManagerOrganizationId: number;
  ManagerContactId: number;
  BaseRent: any;
  BuildingSquareFootage: any;
  BuildingType: any;
  CeilingHeight: any;
  DealStructure: any;
  DriveThru: any;
  FloodZone: any;
  FrontageLength: any;
  HistoricDistrict: any;
  LeaseTerm: any;
  LotSize: any;
  NNNCharges: any;
  OtherComments: any;
  OvernightBoardingPermitted: any;
  ParkingSpaces: any;
  PropertyCondition: any;
  PurchasePrice: any;
  Restrictions: any;
  ServiceAccess: any;
  TIAllowance: any;
  TrafficDrection: any;
  VehiclePerDay: any;
  Zoning: any;
  OrgName: string;
  ManagerOrganizationName: string;
  CONTACTS: Contacts[];
}

export interface Contacts {
  FirstName?: string;
  LastName?: string;
  Email: string;
}
