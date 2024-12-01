export interface BbPlace {
  id: number
  Name: string
  RetailRelationCategories: RetailRelationCategory[]
}

export interface RetailRelationCategory {
  Id: number
  Name: string
  Branches: Branch[]
}

export interface Branch {
  Id: number
  Latitude: number
  Longitude: number
  OrganizationId: number
}
