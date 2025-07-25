export interface Properties {
    id: number
    centerName: string
    centerAddress: string
    centerCity: string
    centerState: string
    zipCode: string
    mainImage: string
  }
  export interface IFile {
    name: string;
    type: string;
    content: string; // Base64-encoded image content
    selected?: boolean; // Add a selected property
  }
  export interface jsonGPT {
    CenterName: string
    CenterType: string
    CenterAddress: string
    CenterCity: string
    CenterState: string
    CenterCounty: any
    ZipCode: any
    LandArea_SF: any
    NumberOfPropertiesInCenter: any
    PercentLeased: any
    SmallestSpaceAvailable: any
    TotalAvailableSpace_SF: number
    NumberOfStores: any
    Availability: Availability[]
    Tenants: Tenant[]
    CenterNameIsAdded?: boolean; // Optional property for CenterName checkbox
    CenterTypeIsAdded?: boolean; // Optional property for CenterType checkbox
    CampaignId:number;
    percentage:number;
    reason:string;
    FolderGuid:string;
    IsSubmitted:boolean;
    userSubmissionId:number;

  }
  
  export interface Tenant {
    id: number
    Name: string
    BuildingSizeSf: any
    SecondaryType: string
    OrgUrl: string
    isAdded: boolean
    addInputVisible?: boolean;  // Tracks visibility of input field for adding new tenants
    newName?: string;  // Holds the new tenant name entered by the user
  }
  
  export interface AvailabilityTenant {
    availability?: Availability[]
    tenants?: Tenant[]
  }
  
  export interface Availability {
    id: number
    BuildingSizeSf: number
    ForLeasePrice: number
    LeaseType: string
    Suite: string
    IsSecondGeneration: boolean
    SecondaryType: string
    isAdded: boolean
    addInputVisible?: boolean;  // Tracks visibility of input field for adding new availability
    newBuildingSize?: number;  // Holds the new building size entered by the user
  }