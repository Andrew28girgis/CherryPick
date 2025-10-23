export interface Notification {
  id: number;
  message: string;
  userId: number;
  isRead: boolean;
  createdDate: string;
  userSubmissionId: number;
   json: any;
  campaignId: number;
  loaded: boolean;
  html: any;
  notificationCategoryId:any;
  contextExtendPrompt:any;
  taskId:any;
  isEndInsertion:any
  ispolygon:boolean
}
