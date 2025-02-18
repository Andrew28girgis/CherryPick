export interface OrganizationsForEmail {
    id: number
    Name: string
    ShoppingCenters: ShoppingCenter[]
    dates?:string[]
  }
  
  export interface ShoppingCenter {
    id: number
    CenterName: string
    CenterCity: string
    CenterState: string
    MainImage: string
  }
  