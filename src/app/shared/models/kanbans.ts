import { KanbanAction } from './kanbanActions';

export interface KanbanCard {
  Id: number;
  targetStakeholderId: number;
  kanbanName: string;
  kanbanStages: KanbanStage[];
}

export interface KanbanStage {
  Id: number;
  stageName: string;
  stageOrder: number;
  isQualified: boolean;
  kanbanId: number;
  kanbanOrganizations: KanbanOrganization[];
  stageActions: KanbanAction[];
}

export interface KanbanOrganization {
  Id: number;
  kanbanStageId: number;
  OrganizationId: string;
  Organization?: any[];
  LeadBroker?: any;
  isExpanded?: boolean;
}

export interface KanOrganization {
  Id: number;
  kanbanStageId: number;
  OrganizationId: string;
  // Organization?: any[];
  // LeadBroker?: any;
  // isExpanded?: boolean;
}

export interface Organization {
  ID?: number;
  Name?: string;
  stakeholderId: number;
  Logo?: string;
  Location?: string;
  AssetType?: string;
  TotalProperties?: number;
}

export interface StakeHolder {
  id?: number;
  name?: string;
}

export interface Client {
  id: number;
  name: string;
  location: string;
  companyLogo: string;
  organization?: Organization;
}

export interface LeadBroker {
  id: number;
  name: string;
  avatar: string;
  stakeholderId?: number;
}

export interface TableStakeholder extends StakeHolder {
  phone: string;
  avatar: string;
}

export interface TableRow {
  id: number;
  client: Client;
  leadBroker: LeadBroker;
  stakeholder: TableStakeholder;
  status: 'Closed' | 'on-hold' | 'Lost';
  date: string;
  Notes: string;
  unit: string;
  unitImg: string;
}

export interface table {
  id: number;
  leadBroker: {
    name: string;
    avatar: string;
    email: string;
    phone: string;
    lastSeen: string;
  };
}
export interface table2 {
  id: number;
  leadBroker: {
    task: string;
    status: 'Not Started' | 'In Progress' | 'Started';
    project: string;
    projectImg: string;
    asignee: string;
    asigneeImg: string;
    due: 'Overdue' | 'Today' | 'Upcoming';
    priority: 'High' | 'Medium' | 'Low' | string;
    notes: string;
  };
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
}

export interface Card {
  title: string;
  description: string;
  image: string;
}
