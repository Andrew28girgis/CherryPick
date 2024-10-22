export class General {
  places: Place[] = [];
  Filter: Filter[] = [];
  Buildings: building[] = [];
  fbo!: Fbo;
  modalObject: any = {};
  activities: Activity[] = [];
  workSpace: WorkSpace[] = [];
  nearsetPlaces!: nearsetPlaces;
  comparable!: Comparable[];
  SpecificPlaces!: SpecificPlaces[];

}

export class AllPlaces{
  centers!:  shoppingMall[];
  standAlonePlaces!:Property[];
}
export class shoppingMall{
  centerName !:string; 
  places:Property[]=[];
}

export interface WorkSpace {
  id: number;
  name: string;
  city: string;
  state: string;
  locations: Locationn[];
  estimatedDevelopmentCost: number;
  noi: number;
  roc: number;
  unit: number;
  matchCount: number;
  isActive: boolean;
  groupsDtos: groupsDtos[];
  numberOfTotalPlaces: number;
  GetFboStage: GetFboStage[];
}

export interface GroupedProperties {
  city: string;
  state: string;
  properties: Property[];
}
export interface SpecificPlaces {
  name: string;
  type: string;
  dist: number;
}
export class Property {
  id!: number;
  address!: string;
  city!: string;
  state!: string;
  zip!: string;
  extras!:any;
  reaction!:string;
  longitude!: number;
  imagesLinks!:string;
  feedBack!:string;
  centerName!:string;
  lat!:number;
  lon!:number
  latitude!: number;
  urban!: boolean;
  suburban!: boolean;
  type!: string;
  secondaryType!: string;
  siteSelectionReason!: string;
  units!: string;
  suite!: string;
  landSf?: any;
  buildingSizeSf!: number;
  parking!: string;
  class!: string;
  zoningCode!: string;
  populationDensity!: number;
  householdIncome!: any;
  employees!: number;
  listingType!: string;
  forSalePrice?: any;
  forLeasePrice?: any;
  leaseType!: string;
  landUse!: string;
  minHighwayDist?: any;
  description!: string;
  mainImage!: string;
  uploadDate!: string;
  placeKey?: any;
  images?: any;
  streetLatitude?: any;
  streetLongitude?: any;
  organizationId?:any;
  heading?: any;
  pitch?: any;
  notes?: any;
  nearestBranchesInMiles?: any;
  nearestCompetitorsInMiles?: any;
  nearestCotenantsMiles?: any;
}

export class listOfNums {
  listOfPartial: number[] = [];
  listOfMatch: number[] = [];
}

export interface groupsDtos {
  matchplaceIds: number[];
  nullplaceIds: number[];
  notMatchplaceIds: number;
  stageId: number;
  name: string;
  matchCount: number;
  notMatchCount: number;
  nullCount: number;
  count: number;
}

export interface Locationn {
  lat: number;
  lng: number;
  addresstype: string;
  isPolygon: boolean;
  boundingboxes: any[];
  class: null;
  displayName: string;
  geokml: string;
  icon: any;
  id: number;
  importance: number;
  locationGroupId: number;
  lon: number;
  name: string;
  osmId: number;
  osmType: string;
  osmaddress: null;
  placeId: number;
  placeRank: number;
  radius: number;
  type: string;
  disableViewButton: boolean;
  insideOutside: any;
  selected: boolean;
}

export interface GetFboStage {
  workSpaceId: number;
  matches: number;
  notMatches: number;
  nulls: number;
}

export class Fbo {
  PlaceId!: number;
  id!: number;
  name!: string;
  estimatedDevelopmentCost!: number;
  unit!: number;
  noi!: number;
  offeringPrice: any;
  diffForAssestment: any;
  roc!: number;
  buyBoxes!: any[];
  workSpaces!: any[];
}

export class Place {
  id!: number;
  organizationId!: number;
  organizationName!: string;
  workSpaceId!: number;
  address!: string;
  type!: string;
  distance?: any;
  lat!: number;
  lon!: number;
  landSf!: number;
  forSalePrice?: any;
  city!: string;
  state!: string;
  zoningCode?: any;
  zip!: string;
  buildingSizeSf!: number;
  far!: number;
  noi?: any;
  maxNoi?: any;
  positionStatus?: any;
  occupiedNote?: any;
  positionStatusNote?: any;
  isAccepted?: any;
  minHighwayDist?: any;
  mainImage!: string;
  notes!: string;
  populationDensity!: number;
  description!: string;
  class!: string;
  landUse!: string;
  secondaryType!: string;
  listingType!: string;
  dateTime!: string;
  distances: any;
  images!: Images;
  stages!: any[];
  centerName!: string;
  urban!: boolean;
  suburban!: boolean;
  outdoorArea_Garden!:string;
  units!: string;
  suite!: string;
  parking!: string;
  householdIncome!: number;
  employees!: number;
  forLeasePrice?: any;
  leaseType!: string;
  placeKey?: any;
  uploadDate!: string;
}

export interface Stages {
  status: number;
  id: number;
  propertyName: string;
  isNumber: number;
  displayName: string;
  isNullable: number;
  isNull: number;
  rangeStart: number;
  rangeEnd: number;
  value: string;
  buyBoxId: number;
  carNumbers: number;
  isSpecial: number;
  buyBox?: any;
  workSpacePlaces: any[];
}
export interface Comparable {
  id: number;
  organizationId: number;
  workSpaceId: number;
  askingPrice: number;
  name: string;
  forSalePrice: number;
  address: string;
  mainImage: string;
  type: string;
  lat: number;
  lon: number;
  landSf: number;
  maxBuildingSize: number;
  numofBeds: number;
  maxNumOfBeds: number;
  city: string;
  state: string;
  zoningCode: number;
  zip: string;
  buildingSizeSf: number;
  far: number;
  noi: number;
  maxNoi: number;
  positionStatus: PositionStatus;
  isOccupied: any;
  occupiedNote: any;
  positionStatusNote: any;
  isAccepted: any;
  notes: any;
  dateTime: Date;
  distances: any;
  distance: any;

  images: Images;
}

export interface Images {
  imagesUrl: string[];
  imagesFileName: string[];
}

export interface PositionStatus {
  id: number;
  status: any;
  statusDescription: string;
  places: any[];
}

export class ScoutlynImages {
  imagesUrl!: string[];
  imagesFileName!: string[];
}

export class adminLogin {
  Email!: string;
  Password!: string;
}

export class Filter {
  cities!: string[];
  state!: string;
}

export class state {
  state!: string;
  cities!: cities[] | null;
}

export class cities {
  city!: string;
  count!: number;
}

export class building {
  id!: number;
  buildingName!: string;
  state!: string;
  city!: string;
  address!: string;
  lat!: number;
  lng!: number;
  forSalePrice!: number;
  appartements!: Appartement[];
  distance!: number;
  photoName!: string;
}

export class Appartement {
  id!: number;
  appartementType!: string;
  rentPerMonth!: number;
  buildingId!: number;
}

export class Activity {
  usertId!: number;
  actionName!: string;
  placeName!: string;
  userName!: string;
  placeId!: number;
  actionDate!: Date;
  workSpacePlaceId!: null;
}

export class nearsetPlaces {
  competitorPlaces: place[] = [];
  ourPlaces: place[] = [];
  cotenants:place[]=[];
}

export interface place {
  buyBoxId: number;
  distance: number;
  id: number;
  isCompetitor: number;
  latitude: number;
  longitude: number;
  name: string;
}

export interface Broker {
  brokerId: number;
  brokerCategoriesData: BrokerCategories[];
}

export interface BrokerCategories {
  categoryId: number;
  categoryName: string;
  organizations: Organization[];
}

export interface Organization {
  id: number;
  name: string;
  address: any;
  phoneNumber: any;
  description: any;
  pipedriveId: any;
  linkedIn: any;
  programName: any;
  linkedIn1: any;
  apartments: any;
  condos: any;
  seniorHousing: any;
  studentHousing: any;
  assistedLiving: any;
  sfrPortfolio: any;
  mobileHomePark: any;
  coLiving: any;
  office: any;
  medicalOffice: any;
  manufacturing: any;
  ltIndustrial: any;
  cannabis: any;
  retail: any;
  hotel: any;
  land: any;
  selfStorage: any;
  religious: any;
  hospital: any;
  other: any;
  leasedFee: any;
  tenancy: any;
  singleTenantList: any;
  singleTenantMinBondCreditRating: any;
  hotelFlagRequired: any;
  hotelFlagList: any;
  acquisition: any;
  newDevelopment: any;
  redevelopment: any;
  refinance: any;
  loanTerms: any;
  senior: any;
  mezzanine: any;
  preferredEquity: any;
  pace: any;
  jvEquity: any;
  minimumLoanSize: any;
  maximumLoanSize: any;
  maxLtv: any;
  maxLtc: any;
  asStabilizedLtv: any;
  minDscr: any;
  investor: any;
  ownerOccupier: any;
  targetStates: any;
  targetCounties: any;
  sponsorStates: any;
  international: any;
  recourse: any;
  corpGuarantorOk: any;
  orgId: any;
  demoOrgId: any;
  lenderName: any;
  loanProgramType: any;
  contactEmailAddress: any;
  startsTransparent: any;
  lenderPays: any;
  lenderFee: any;
  disableAutoMatch: any;
  contractStatus: any;
  contactName: any;
  contactNumber: any;
  notes: any;
  requiredFiles: any;
  rateIndex: any;
  minimumSpread: any;
  maximumSpread: any;
  typicalAmortization: any;
  prepaymentPenalty: any;
  lastUpdated: any;
  lastUpdatedBy: any;
  capSnapId: any;
  url: any;
  states: any;
  isActive: any;
  lenderType: any;
  summary: any;
  status: string;
  organizationCategoryId: number;
  internalTeam: any;
  externalTeam: any;
  cityExpansions: any;
  timeLineEvents: any;
  organizationCategory: any;
  contacts: any[];
  loanProfiles: any[];
  buyBoxes: any[];
  microDeals: any[];
  orgFieldValues: any[];
  organizationPlaces: any[];
  organizationProjectTypes: any[];
  properties: any[];
  taskActions: any[];
  placeTypes: any;
}


export class AnotherPlaces{
  competitorPlaces!:MapPlace[];
  cotenants!:MapPlace[];
  ourPlaces!:MapPlace[];
}

export class MapPlace{
  buyBoxId!:number;
  distance!:any;
  id!:number;
  isCompetitor!:number;
  latitude!:number;
  longitude!:number; 
  name!:string;
}