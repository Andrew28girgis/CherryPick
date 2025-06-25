export interface Center {
    Id: number
    CenterName: string
    CenterType: string
    CenterAddress: string
    CenterCity: string
    CenterState: string
    AnchorGLA_SF?: number
    CenterCounty: string
    CenterRBA_GLA?: number
    LandArea_SF?: number
    Latitude: number
    Longitude: number
    NumberOfParkingSpaces?: number
    NumberOfPropertiesInCenter?: number
    PercentLeased?: number
    SmallestSpaceAvailable?: number
    SubmarketCluster: string
    SubmarketName: string
    TotalAvailableSpace_SF?: number
    YearBuilt?: number
    YearRenovated?: number
    NumberOfStores?: number
    SignageImage: string
    MainImage: string
    ZipCode?: string
    PlaceKey?: string
    StreetViewURL: string
    Description: string
    DocsLink: string
    Employees: number
    HouseholdIncome: number
    Images: string
    Notes: string
    PopulationDensity: number
    SitePlan: string
    SiteSelectionReason: string
    kanbanTemplateStageId: number
    MarketSurveyId: number
    Deleted: boolean
    kanbanStageId: number
    stageName: string
    kanbanId: number
    ShoppingCenter: ShoppingCenter
    AnchorTenants?: string
    AverageWeightedRent?: string
    MarketName?: string
    SubletVacantSpace?: number
    Gallary?: string
    ZoningCode?: string
    Suburban?: boolean
    Neighbourhood?: string
    isDropdownOpen?: boolean
    CampaignId: number
    SentMails?: SentMails
    lastOutgoingEmail:any
    lastIncomingEmail:any
  }
 
  
  export interface ShoppingCenter {
    Places: Place[]
    Comments: Comment[]
    Reactions: Reaction[]
    BuyBoxPlaces: BuyBoxPlace[]
    ManagerOrganization: ManagerOrganization[]
    UserSubmmision: UserSubmmision[]
  }
  export interface UserSubmmision {
    Id?: number;
    CreatedDate?: string;
    Percentage?: number;
    SubmmisionLink: string | null;
    UserId?: number;
    FirstName?: string;
    LastName?: string;
  }
  
  export interface Reaction {
    Id?: number
    ContactId?: number
    MarketSurveyId?: number
    ReactionId?: number
    ReactionDate?: string
    Firstname?: string
    Lastname?: string
    
  }
  

  export interface Comment {
    Id?: number
    ContactId?: number
    Firstname?: string
    Lastname?: string
    MarketSurveyId?: number
    Comment?: string
    CommentDate?: string
    ParentCommentId?: number
  }
  
  export interface ManagerOrganization{
    ID: number
    Name: string
    Firstname:string
    LastName :string
    CellPhone : number
    Email: string
    ContactId: number
  }
 
  export interface Place {
    Id: number
    Address: string
    City: string
    State: string
    Zip: string
    Longitude: any
    Latitude: any
    StreetViewURL: string
    Type: string
    Units: string
    ZoningCode: string
    LandUse: string
    BuildingSizeSf: number
    Description: string
    UploadDate: string
    Class: string
    SecondaryType: string
    ListingType: string
    MainImage: string
    PopulationDensity: string
    ForLeasePrice: string
    Employees: string
    HouseholdIncome: string
    Suburban: boolean
    Urban: boolean
    CenterName: string
    LeaseType: string
    SiteSelectionReason: string
    Parking: string
    Suite: string
    Heading: number
    Images: string
    Notes: string
    Pitch: number
    StreetLatitude: number
    StreetLongitude: number
    Extras: string
    ShoppingCenterId: number
    Place:Root
    CampaignId:number
    Checked: boolean
    MailId:number
  }
  
   
  export interface Root {
    BuyBoxPlaces: BuyBoxPlace[]
  }
  
  export interface BuyBoxPlace {
    CategoryId : number
    Distance : number
    PlaceID : number
    RelationOrganizationId : number
    RelationOrganizationName :string
  }
   
  
  export interface BuyBoxPlace {
    ShoppingCenterID: number
    CategoryId: number
    BuyBoxPlaceId: number
    BuyBoxPlaceName: string
    Distance: number
  }
  
  export interface Stage {
    id: number;
    stageName: string;
    stageOrder: number;
    isQualified: boolean;
    kanbanTemplateId: number;
  }

  export interface SentMails {
    Id: number
    Date:Date
    Direction:number
  }
