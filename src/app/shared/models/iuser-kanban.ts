export interface IUserKanban {
  Id: number;
  targetStakeholderId: number;
  kanbanName: string;
  kanbanTemplateId: number;
  kanbanDefinitions: KanbanDefinition[];
}

export interface KanbanDefinition {
  Id: number;
  kanbanId: number;
  contactId: number;
  OrganizationId: number;
  Organization: Organization[];
}

export interface Organization {
  ID: number;
  Name: string;
  Description: string;
  LinkedIn: string;
  URL: string;
  Summary: string;
  OrganizationCategoryId: number;
  stakeholderId: number;
  LogoURL: string;
  minid: number;
  Contact: Contact[];
}

export interface Contact {
  ID: number;
  Firstname: string;
  Lastname: string;
  Email: string;
  Notes: string;
  OrganizationId: number;
  LinkedIn: string;
  CapSnapOrgId: number;
  Profile: string;
  Area: string;
  FormattedCellPhone: string;
  Token: string;
  LastSignInDate: string;
  Password: string;
  RobinFeatures: string;
  EmailSignature: string;
  AccountMicrosoftLinked: boolean;
  ReadEmailWithReplies: boolean;
  Photo: string;
  SendMailTypeId: number;
  AccountGoogleLinked: boolean;
  VirtualEmail: string;
}
