export interface ShoppingCenter {
  id: number
  CenterName: string
  CenterAddress: string
  CenterCity: string
  CenterState: string
  Latitude: number
  Longitude: number
  DocsLink?: string
  SitePlan?: string
  MainImage: string
  MarketSurveyShoppingCenters: MarketSurveyShoppingCenter[]
  StreetViewURL?: string
  hasSiteSelectionReason?: boolean; // Add this property
  }

  export interface MarketSurveyShoppingCenter {
    Id: number
    SiteSelectionReason?: string
    Place: Place[]
  }
  
  export interface Place {
    Id: number;
    BuildingSizeSf?: number;
    SecondaryType: string;
    StreetViewURL: string;
    MarketSurveyPlaces: MarketSurveyPlace[];
    Address?: string;
    City?: string;
    State?: string;
    Zip?: string;
    Type?: string;
    checked?: boolean; // Property to track checkbox state
  }
  export interface MarketSurveyPlace {
    Id: number
    SiteSelectionReason?: string
  }

  export interface BuyBoxCityState {
    state: string;
    city: string;
  }
  
  export interface RetailRelation {
    id: number;
    name: string;
  }
  export interface Organization {
    id: number;
    name: string;
  }
  export interface StateCity {
    stateCode: string;
    city: string;
  }