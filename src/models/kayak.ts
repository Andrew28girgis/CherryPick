export interface KayakResult {
    Ids: string
    Result: Result[]
  }
  
  export interface Result {
    Id: number
    CenterName: string
    CenterAddress: string
    CenterCity: string
    CenterState: string,
    MainImage: string,
    place: Place[]
  }
  
  export interface Place {
    Id?: number
    BuildingSizeSf?: number
    Suite?: string
    ForLeasePrice?: number
  }
  export interface StatesAndCities {
    stateCode: string
    city: string
  }