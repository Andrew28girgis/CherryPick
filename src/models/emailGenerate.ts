export interface Generated {
    Buybox: Buybox[]
    Releations: Releation[]
    BuyBoxShoppingCenters: BuyBoxShoppingCenter[]
  }
  
  export interface Buybox {
    Buyboxid: number
    BuyBoxOrganization: BuyBoxOrganization[]
    Description:string
  }
  
  export interface BuyBoxOrganization {
    BuyBoxOrganizationId: number
    Name: string
    BuyBoxOrganizationDescription: string
    ManagerOrganization: ManagerOrganization[]
  }
  
  export interface ManagerOrganization {
    showDescription: boolean
    ManagerOrganizationId: number
    ManagerOrganizationName: string
    ManagerOrganizationContacts: ManagerOrganizationContact[]
    ManagerOrganizationDescription: string

  }
  
  export interface ManagerOrganizationContact {
    selected: any
    ContactId: number
    Firstname: string
    LastName: string
    AssistantName:string
    assistantSelected?: boolean; 
  }
  
  export interface Releation {
    relationSelect:boolean
    category: string
    id: number
    Name: string
    RetailRelationCategoryId: number
  }
  
  export interface BuyBoxShoppingCenter {
    ID: number
    CenterName: string
    ShoppingCenterManager?: ShoppingCenterManager[]
    Cotenants?: Cotenant[]
  }
  
  export interface ShoppingCenterManager {
    ID: number
    Name: string
    Address?: string
    City?: string
    State?: string
    ShoppingCenterManagerContact: ShoppingCenterManagerContact[]
    LogoURL?: string
    PhoneNumber?: string
    Description?: string
    LinkedIn?: string
    States?: string
    Status?: string
    stakeholderId?: number
  }
  
  export interface ShoppingCenterManagerContact {
    ID: number
    OrganizationId: number
    Firstname?: string
    Lastname?: string
    Email?: string
    CellPhone?: string
    Area?: string
    FormattedCellPhone?: string
    Notes?: string
  }
  
  export interface Cotenant {
    CotenantId: number
    CotenantName: string
    ActivityType?: string
    selected?: boolean; // Add the 'selected' property here
  }

  export interface RelationNames {
    id: number;
    name: string;
    selected?: boolean;
  }