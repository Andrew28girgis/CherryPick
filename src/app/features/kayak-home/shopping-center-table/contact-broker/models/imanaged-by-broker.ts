import { ICenterData } from "./icenter-data";

export interface IManagedByBroker {
  contactId: number;
  centers: ICenterData[];
}
