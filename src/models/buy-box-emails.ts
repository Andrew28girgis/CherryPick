export interface BuyBoxEmails {
  id: number
  StageId: number
  Organization: Organization[]
}

export interface Organization {
  OrganizationId: number
  OrganizationName: string
  Contact: Contact[]
}

export interface Contact {
  ContactId: number
  Firstname: string
  Lastname: string
}

export interface Stages {
  id: number
  title: string
  dealTypeId: any
  displayName: any
}
