export interface IUserComment {
  id: number;
  Firstname: string;
  LastName: string;
  Photo: any;
  ShoppingCenters: ShoppingCenter[];
}

export interface ShoppingCenter {
  id: number;
  CenterName: string;
  CenterCity: string;
  CenterState: string;
  CenterAddress: string;
  PropertiesComments: PropertiesComment[];
}

export interface PropertiesComment {
  id: number;
  Comment: string;
  CommentDate: string;
  buyBoxes: BuyBox[];
}

export interface BuyBox {
  id: number;
  Name: string;
  Organization: Organization[];
}

export interface Organization {
  LogoURL: string;
}
