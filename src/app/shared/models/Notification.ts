export interface Notification {
  id: number;
  message: string;
  userId: number;
  isRead: number;
  createdDate: string;
  userSubmissionId: number;
  notificationCategoryId: any;
}
