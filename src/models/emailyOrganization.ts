export interface OrganizationsForEmail {
    id: number
    Name: string
    ShoppingCenters: ShoppingCenter[]
  }
  
  export interface ShoppingCenter {
    id: number
    CenterName: string
    CenterCity: string
    CenterState: string
    MainImage: string
  }
  