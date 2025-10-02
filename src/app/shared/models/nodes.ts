export interface FlowObject {
  id: string;
  name: string;
  position: { x: number; y: number };
}

export interface FlowConnection {
  from: string;
  to: string;
  mailId?: any;
  organizationId?:any;
  contactId?: any;
  shoppingCenterId?: any;
  date: Date;
}
