export interface BuyBoxMicroDeals {
  id: number
  StageId: number
  Organization: Organization[]
}

export interface Organization {
  OrganizationId: any
  OrganizationName: string
  Contact: Contact[]
  showContacts:boolean
  showMoreContacts?: boolean;  // Add this line

}

export interface Contact {
  ContactId: number
  Firstname: string
  Lastname: string
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
  ContactId: number
  MailsContacts: MailsContact[]
  ID?: number;
  Body?: string;
  MicroDealId?: number;
  ResponseStatus?: string;
}

export interface MailsContact {
  MailContactId: number
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



export interface EmailDashboard {
  Id: number
  Title: string
  Organizations?: OrganizationDashboard[]
}

export interface OrganizationDashboard {
  ID: number
  Name: string
  MicroDealId:any
  LastActivityDate?: string
}