export interface IOrganization {
  id: number;
  name: string;
  contact: IContact[];
}

export interface IContact {
  ID?: number;
  Firstname?: string;
  Lastname?: string;
  Email?: string;
  CellPhone?: string;
  OrganizationId?: number;
  JobTitle?: string;
  Area?: string;
  FormattedCellPhone?: string;
  Password?: string;
  RobinFeatures?: string;
  AccountMicrosoftLinked?: boolean;
  ReadEmailWithReplies?: boolean;
  AccountGoogleLinked?: boolean;
  VirtualEmail?: string;
  x?: number;
  IsEncrypted?: boolean;
  LinkedIn?: string;
  CapSnapOrgId?: number;
  Profile?: string;
  Flag?: number;
  CapSnapId?: number;
  Notes?: string;
  PipedriveId?: number;
  Address?: string;
}
