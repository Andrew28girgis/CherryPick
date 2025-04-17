export interface IEmailContent {
  mailId: number;
  direction: number;
  subject: string;
  body: string;
  organizationId: number;
  organizationName: string;
  isEditing: boolean;
}
