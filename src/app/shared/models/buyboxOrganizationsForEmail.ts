export interface BuyBoxOrganizationsForEmail {
  Id: number
  Name: string
  LogoURL: string
  Contact: BuyBoxOrganizationsForEmailContact[]
}

export interface BuyBoxOrganizationsForEmailContact {
  id: number
  Firstname: string
  Lastname: string
  selected: boolean
  selectedName: string
  Centers: Contact_ShoppingCenter[]
}

export interface Contact_ShoppingCenter {
  id: number
  selected: boolean
  CenterName: string
}