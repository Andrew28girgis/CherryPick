export interface notificationCategory {
    id: number
    message: string
    userId: number
    isRead: boolean
    createdDate: string
    notificationCategoryId?: number
  }
    export interface EmailNotificationResponse {
    id: number;
    bcc: string | null;
    fromAddress: string | null;
    cc: string | null;
    body: string;
    messageId: string | null;
    toAddress: string | null;
    date: string;
    subject: string;
    direction: number;
    uid: string | null;
    opened: boolean | null;
    dealId: number | null;
    outbox: any | null;
    macroDealId: number | null;
    microDealId: number | null;
    activeDealId: number | null;
    contactId: number;
    responseStatus: any | null;
    hasFollowUp: boolean | null;
    isFollowUp: boolean | null;
    followUpDate: string | null;
    emailAccountId: number | null;
    buyBoxId: number;
    isCC: boolean;
    parentMailId: number;
    mailContextId: number;
    campaignId: number | null;
    id1: number;
    contactId1: number;
    mailId: number;
    email: string | null;
    responseStatus1: any | null;
    organizationName:string | null;
    buyBoxName:string | null;
    }

    export interface SyncNotificationResponse {
    id: number;
    name: string;
    organizationId: number;
    }

    export interface SubmissionNotificationResponse {
    actionId: number;
    }