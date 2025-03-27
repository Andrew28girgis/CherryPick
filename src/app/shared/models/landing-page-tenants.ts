export interface LandingPageTenants {
    Buybox: Array<{
        BuyBoxOrganization: Array<{
            ManagerOrganization: Array<{
                ManagerOrganizationContacts: Array<{
                    Firstname: string;
                    LastName: string;
                    LinkedIn: string;
                    Photo: string;
                    Profile: string;
                }>;
                ManagerOrganizationId: number;
                ManagerOrganizationName: string;
                ManagerOrganizationDescription: string;
            }>;
            BuyBoxOrganizationId: number;
            BuyBoxOrganizationDescription: string;
            Name: string;
        }>;
        MinBuildingSize: number;
        MaxBuildingSize: number;
        Description: string | string[];
    }>;
    Releations: Releation[]
    BuyBoxShoppingCenters: BuyBoxShoppingCenter[]
}
export interface Buybox {
    Buyboxid: number
    Description: string
    MinBuildingSize: number
    MaxBuildingSize: number
    BuyBoxOrganization: BuyBoxOrganization[]
  }
  
  export interface BuyBoxOrganization {
    BuyBoxOrganizationId: number
    Name: string
    BuyBoxOrganizationDescription: string
    ManagerOrganization: ManagerOrganization[]
  }
  
  export interface ManagerOrganization {
    ManagerOrganizationId: number
    ManagerOrganizationName: string
    ManagerOrganizationDescription: string
    ManagerOrganizationContacts: ManagerOrganizationContact[]
  }
  
  export interface ManagerOrganizationContact {
    ContactId: number
    Firstname: string
    LastName: string
    EmailSignature: string
    Profile: string
    LinkedIn: string
    Photo: string
  }
  
  export interface Releation {
    id: number
    Name: string
    RetailRelationCategoryId: number
  }
  
  export interface BuyBoxShoppingCenter {
    ID: number
    CenterName: string
    ShoppingCenterManager: ShoppingCenterManager[]
    Cotenants: Cotenant[]
  }
  
  export interface ShoppingCenterManager {
    ID: number
    Name: string
    URL: string
    Summary: string
    stakeholderId?: number
    LogoURL: string
    minid: number
    ShoppingCenterManagerContact: ShoppingCenterManagerContact[]
    Address?: string
    PhoneNumber?: string
    Description?: string
    LinkedIn?: string
    Apartments?: string
    Condos?: string
    Office?: string
    Manufacturing?: string
    Cannabis?: string
    Retail?: string
    Hotel?: string
    Land?: string
    Religious?: string
    Hospital?: string
    Other?: string
    Tenancy?: string
    Acquisition?: string
    Redevelopment?: string
    Refinance?: string
    Senior?: string
    Mezzanine?: string
    PACE?: string
    Investor?: string
    International?: string
    Recourse?: string
    StartsTransparent?: string
    LenderPays?: string
    LenderFee?: string
    ContractStatus?: string
    Notes?: string
    States?: string
    OrganizationCategoryId?: number
    Status?: string
    ExternalTeam?: string
    InternalTeam?: string
    Usage?: string
    City?: string
    State?: string
  }
  
  export interface ShoppingCenterManagerContact {
    ID: number
    Firstname: string
    Lastname: string
    Email: string
    CellPhone: string
    OrganizationId: number
    JobTitle?: string
    Area?: string
    FormattedCellPhone?: string
    Password: string
    RobinFeatures?: string
    AccountMicrosoftLinked: boolean
    ReadEmailWithReplies: boolean
    AccountGoogleLinked: boolean
    VirtualEmail: string
    Notes?: string
    CapSnapOrgId?: number
    Email2?: string
    Email3?: string
    Phone1?: string
    Phone2?: string
    LinkedIn?: string
    Address?: string
    Profile?: string
    Token?: string
    Flag?: number
  }
  
  export interface Cotenant {
    CotenantId: number
    CotenantName: string
  }