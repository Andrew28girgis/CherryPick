export interface PlaceCotenants {
    ID: number
    Name: string
    ActivityType: string
    Branches: Branch[]
  }
  
  export interface Branch {
    Id: number
    Latitude: number
    Longitude: number
    OrganizationId: number
    Distance: number
  }
  