export interface ICampaignEmail {
  id: number;
  message: string;
  userId: number;
  isRead: boolean;
  createdDate: string;
  notificationCategoryId: number;
}
