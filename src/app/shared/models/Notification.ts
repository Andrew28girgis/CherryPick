export interface Notification {
  id: number;
  message: string;
  userId: number;
  isRead: number;
  createdDate: string;
  userSubmissionId: number;
  notificationCategoryId: any;
  json: any;
  campaignId: number;
  loaded: boolean;
  html: any;
  role:any;
}
