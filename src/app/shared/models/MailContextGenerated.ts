export interface MailContextGenerated {
    MailContextId: number
    CreatedDate: string
    NumberOfMailGenerated: number
    Context: string
    C: C[]
  }
  
  export interface C {
    Firstname: string
    Lastname: string
    SC: Sc[]
  }
  
  export interface Sc {
    Id: number
    CenterName: string
    P: P[]
  }
  
  export interface P {
    PromptName: string
    BB: Bb[]
  }
  
  export interface Bb {
    BuyBoxName: string
    O: O[]
  }
  
  export interface O {
    OrganizationId: number
    Name: string
    MailSendCount: number
  }
  