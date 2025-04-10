export interface BuyBoxMicroDeals {
  OrganizationId: number
  OrganizationName: string
  Contact: Contact[]
}

export interface Contact {
  ContactId: number
  Firstname: string
  Lastname: string
  ShoppingCenters: ShoppingCenter[]
}

export interface ShoppingCenter {
  id: number
  CenterName: string
  EmailStats: EmailStat[]
}

export interface EmailStat {
  Outbox: number
  Sent: number
  Inbox: number
}



export interface Stages {
  id: any
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
  FromAddress: string;
  ContactId: number
  MailsContacts: MailsContact[]
  // ID?: number;
  Body?: string;
  MicroDealId?: number;
  ResponseStatus?: string;
}

export interface MailsContact {
  MailContactId: number
}

export interface EmailInfo {
  ID: number
  FromAddress: string
  CC: string
  Body: string
  ToAddress: string
  Date: string
  Subject: string
  Direction: number
  Opened: number
  outbox: string
  MacroDealId: number
  MicroDealId: number
  ContactId: number
  ResponseStatus: string
  HasFollowUp: number
  BuyBoxId: number
  IsCC: boolean
  ParentMailId: number

  // ID: number
  // Body: string
  // Date: string
  // Subject: string
  // Direction: number
  // Opened: number
  // MicroDealId: number
  // ContactId: number
  // ResponseStatus: string
  // BuyBoxId: number
  // IsCC: boolean
  // ParentMailId: number

  // ID: number
  // FromAddress: string
  // CC: string
  // Body: string
  // ToAddress: string
  // Date: string
  // Subject: string
  // Direction: number
  // Opened: number
  // outbox: string
  // MacroDealId: number
  // MicroDealId: number
  // ContactId: number
  // ResponseStatus: string
  // HasFollowUp: number
  // BuyBoxId: number
  // IsCC: boolean
  // ParentMailId: number
}



export interface EmailDashboard {
  Id: number
  Title: string
  Organizations?: OrganizationDashboard[]
}

export interface OrganizationDashboard {
  id: number
  Name: string
  MicroDealId:any
  LastActivityDate?: string
}