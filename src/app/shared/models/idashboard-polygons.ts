export interface IDashboardPolygons {
    Id: number
    Name: string
    Description: string
    MinBuildingSize: number
    MaxBuildingSize: number
    OrganizationId: number
    ManagerOrganizationId: number
    kanbanId?: number
    ManagerContactId: number
    geojsons: Geojson[]
  }
  
  export interface Geojson {
    Name: string
    State?: string
    Places: number
  }
  