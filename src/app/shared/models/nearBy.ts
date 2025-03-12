
export interface NearByType {
  Id: number
  Name: string
  Branches: Branch[]
}

export interface Branch {
  Id: number
  Latitude: number
  Longitude: number
  OrganizationId: number
  RelationOrganization: RelationOrganization[]
}

export interface RelationOrganization {
  id: number
  Name: string
  RelationCategoryId: number
  RelationCategoryName: string
  Distance: number
}
