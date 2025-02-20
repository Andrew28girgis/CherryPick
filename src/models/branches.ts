export interface OrgBranch {
    Id: number
    Name: string
    Branches: Branch[]
  }
  
  export interface Branch {
    Id: number
    Latitude: number
    Longitude: number
    OrganizationId: number
    Distance: number
    City  : string
    State : string
  }
  