export interface BbPlace {
    Id: number
    Name: string
    BuyBoxPlaces: BuyBoxPlace[]
  }
  
  export interface BuyBoxPlace {
    Id: number
    Latitude: number
    Longitude: number
    IsCompetitor: number
    OrganizationId: number
    CategoryId: number
    BuyBoxPlaceId: number
  }
  