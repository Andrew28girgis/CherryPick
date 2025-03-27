export class cadenceSidebar {
  tenantOrganizations: StageOrganization[] = [];
}

export interface StageOrganization {
  isOpen?: boolean;
  kanbanOrganizationid: number;
  OrganizationId: number;
  OrganizationName: string;
  LogoURL: string;
  Actions: Action[];
  OtherKanbans: OtherKanban[];
}

export interface Action {
  ActionId: number;
  actionLevel: string;
  actionType: string;
  actionName: string;
  actionURL: string;
  actionUrlDecode: string;
  KanbanTemplateStageId: number;
}

export interface OtherKanban {
  id: number;
  kanbanName: string;
}

export interface IUserBuybox {
  isOpen?: boolean;
  checked: boolean;
  id: number;
  name: string;
  description: string;
  fpoId: any;
  comparableTypeId: number;
  minBuildingSize: number;
  maxBuildingSize: number;
  minLandSize: any;
  maxLandSize: any;
  acquisitionTypeId: any;
  emptyLand: any;
  minBuildingUnits: any;
  maxBuildingUnits: any;
  organizationId: number;
  managerOrganizationId: number;
  managerContactId: number;
  baseRent: any;
  buildingSquareFootage: any;
  buildingType: any;
  ceilingHeight: any;
  dealStructure: any;
  driveThru: any;
  floodZone: any;
  frontageLength: any;
  historicDistrict: any;
  leaseTerm: any;
  lotSize: any;
  nnnCharges: any;
  otherComments: any;
  overnightBoardingPermitted: any;
  parkingSpaces: any;
  propertyCondition: any;
  purchasePrice: any;
  restrictions: any;
  serviceAccess: any;
  tiAllowance: any;
  trafficDrection: any;
  vehiclePerDay: any;
  zoning: any;
  IBuyboxOrganization: IBuyboxOrganization[];
}

export interface IBuyboxOrganization {
  isOpen?: boolean;
  checked: boolean;
  id: number;
  name: string;
  contacts: IBuyBoxContact[];
}
export interface IBuyBoxContact {
  checked: boolean;
  id: number;
  Firstname: string;
  Lastname: string;
  Centers: IBuyBoxCenter[];
}

export interface IBuyBoxCenter {
  checked: boolean;
  id: number;
  CenterName: string;
}

export interface buyboxChecklist {
  buyboxId: number[];
  organizations: OrganizationChecked[];
}
export interface OrganizationChecked {
  id: number;
  contacts: ContactsChecked[];
}
export interface ContactsChecked {
  id: number;
  shoppingCenterId: number[];
}
