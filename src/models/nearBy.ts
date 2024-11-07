
export interface NearByType {
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
  BuyBoxPlace: BuyBoxPlace2[]
}

export interface BuyBoxPlace2 {
  Id: number
  Name: string
  Distance: number
}
