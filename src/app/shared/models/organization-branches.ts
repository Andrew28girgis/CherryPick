export interface OrganizationBranches {
    ID: number;
    Name: string;
    Address: string;
    PhoneNumber: string;
    Description: string;
    LinkedIn: string;
    Notes: string;
    URL: string;
    States: string;
    Summary: string;
    OrganizationCategoryId: number;
    LogoURL: string;
    minid: number;
    branches: Branch[]; 
}

export interface Branch {
    Id: number;
    Latitude: number;
    Longitude: number;
    OrganizationId: number;
    ShoppingCenterId: number;
}
