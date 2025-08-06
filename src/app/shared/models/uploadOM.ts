export interface UploadOM {
  pdfUrl: any
  images: any
  Images: any
  mainImage: any
  MainImage: any
  shoppingCenterId: number
  contactId: any
  userSubmissionId: any
  isSubmitted: any
  folderGuid: any
  notes: any
  reason: any
  percentage: any
  campaignId: any
  Contacts: Contact[]
  Tenants: Tenant[]
  Availability: Availability[]
  Class: any
  NumberOfStores: any
  TotalAvailableSpace_SF: number
  SmallestSpaceAvailable: number
  PercentLeased: any
  NumberOfPropertiesInCenter: any
  LandArea_SF: any
  ZipCode: string
  CenterCounty: any
  CenterState: string
  CenterCity: string
  CenterAddress: string
  CenterType: any
  CenterName: string
  latitude: any
  longitude: any
}

export interface Contact {
  firstName: string
  lastName: string
  email: string
}

export interface Tenant {
  Name: string
  BuildingSizeSf: any
  OrgUrl?: string
  id: any
  isAdded: any
}

export interface Availability {
  BuildingSizeSf: number
  ForLeasePrice: number
  LeaseType: string
  Suite: string
  IsSecondGeneration: string
  SecondaryType: any
  Extras: string
  Notes: any
  id: any
  isAdded: any
}
