export interface Notification {
  id: number;
  message: string;
  userId: number;
  isRead: boolean;
  createdDate: string;
  userSubmissionId: number;
  json: any;
  campaignId: number;
  shoppingCenterId: any;
  contactId: number;
  organizationId: number;
  emilyConversationCategoryId: number;
  sourceUrl:any;
  loaded: boolean;
  html: any;
  notificationCategoryId: any;
  contextExtendPrompt: any;
  taskId: any;
  isEndInsertion: any;
  ispolygon: boolean;
  isEmilyChat: any;
}
