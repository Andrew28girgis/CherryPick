export interface BuyBoxMicroDeals {
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


export interface BuyBoxEmails {
  MicrodealId: number
  mail: Mail[]
}

export interface Mail {
  id: number
  Subject: string
  Date: string
  Direction: number
  ContactId: number
}

export interface EmailInfo {
  ID: number
  Body: string
  Date: string
  Subject: string
  Direction: number
  MicroDealId: number
  ContactId: number
  ResponseStatus: string
}

