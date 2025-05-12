export interface Email {
    ID: number
    Body: any
    Date: string
    Subject: string
    Direction: number
    ContactId: number
    ResponseStatus: string
    BuyBoxId: number
    IsCC: boolean
    ParentMailId: number
    MailContextId: number
    CampaignId: number
    IsReply: boolean
    HasReadFolderData: boolean
  }
  