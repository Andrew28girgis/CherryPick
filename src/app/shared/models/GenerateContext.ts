export interface GenerateContextDTO
{
     IsReply? :boolean;
     OldMail?:string;
     ContactId : number;
     // BuyBoxId : number|null;
     CampaignId : number;
     OrganizationId : number;
     AddMinMaxSize : boolean;
     AddCompetitors : boolean;
     AddComplementaries : boolean;
     AddBuyBoxManageOrgDesc : boolean;
     AddSpecificBuyBoxDesc : boolean;
     AddBuyBoxDesc : boolean;
     IsCC : boolean;
     AddLandLordPage : boolean;
     GetContactManagers : GetContactManagerDTO[];
}

export interface GetContactManagerDTO
{
     ContactId : number;
     ContactName : string;
     ShoppingCentersName :string[];
     ShoppingCentersID? :string[];
}


export interface GetManagerOrgDTO
{
     OrganizationId  : number;
     GetContactManagers : GetContactManagerDTO[];
}