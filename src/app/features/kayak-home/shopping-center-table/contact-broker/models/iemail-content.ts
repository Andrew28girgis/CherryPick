export interface IEmailContent {
  MailId: number;
  Direction: number;
  Subject: string;
  Body: string;
  isEditing: boolean;
  O: O[];
}

export interface O {
  OrganizationId: number;
  OrganizationName: string;
  C: C[];
}

export interface C {
  Email: string;
}
