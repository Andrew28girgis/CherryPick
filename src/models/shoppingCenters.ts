export interface Center {
    Id: number
    CenterName: string
    CenterType: string
    CenterAddress: string
    CenterCity: string
    CenterState: string
    Latitude: number
    Longitude: number
    MainImage: string
    Heading: number
    Pitch: number
    StreetLatitude: number
    StreetLongitude: number
    ShoppingCenter: ShoppingCenter
  }
  
  export interface ShoppingCenter {
    Places: Place[]
    BuyBoxPlaces: BuyBoxPlace[]
  }
  
  export interface Place {
    Id: number
    Address: string
    City: string
    State: string
    Zip: string
    Longitude: number
    Latitude: number
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
  }
  
   
  export interface Root {
    BuyBoxPlaces: BuyBoxPlace[]
  }
  
  export interface BuyBoxPlace {
    PlaceID: number
    CategoryId: number
    BuyBoxPlaceId: number
    Distance: number
    BuyBoxPlaceName: string
  }
   
  
  export interface BuyBoxPlace {
    ShoppingCenterID: number
    CategoryId: number
    BuyBoxPlaceId: number
    BuyBoxPlaceName: string
    Distance: number
  }
  