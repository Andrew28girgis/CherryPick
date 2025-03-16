export interface IDashboardProperty {
  id: number;
  name: string;
  ShoppingCenters: ShoppingCenter[];
}

export interface ShoppingCenter {
  id: number;
  CenterName: string;
  CenterAddress: string;
  CenterCity: string;
  CenterState: string;
  MainImage: string;
  kanbanStages: KanbanStage[];
}

export interface KanbanStage {
  Id: number;
  stageName: string;
  Organization: Organization[];
}

export interface Organization {
  id: number;
  Name: string;
  LogoURL: string;
  Contact: Contact[];
}

export interface Contact {
  id: number;
  Firstname: string;
  Lastname: string;
  kanbans: kanban[];
}

export interface kanban {
  id: number;
}
