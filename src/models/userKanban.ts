export interface Kanban {
    isCollapsed: boolean
    Id: number
    targetStakeholderId: number
    kanbanTemplateId: number
    kanbanName: string
    kanbanDefinitions: KanbanDefinition[]
  }
  
  export interface KanbanDefinition {
    Id: number
    kanbanId: number
    contactId: number
    OrganizationId: number
    Organization: Organization[]
  }
  export interface Organization {
    ID: number
    Name: string
    Address: string
    PhoneNumber: string
    Description: string
    stakeholderId: number
    LinkedIn: string
    States: string
    Status: string
    Contacts: Contact[]
  }

  export interface Contact {
    ID: number
    Firstname: string
    Lastname: string
    Email: string
    CellPhone: string
    OrganizationId: number
    LinkedIn: string
    JobTitle: string
    Profile: string
    Area: string
    FormattedCellPhone: string
    LastSignInDate: string
    Password: string 
  }
  

  