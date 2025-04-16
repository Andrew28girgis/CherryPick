import { ManagerOrganization } from "src/app/shared/models/shoppingCenters";

export interface IChooseBroker {
    selectedContacts:ManagerOrganization[]
    sendAsTo:boolean
    sendAsCC:boolean
}
