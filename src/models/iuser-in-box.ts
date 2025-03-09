export interface IUserInBox {
  id: number;
  Subject: string;
  FromAddress: any;
  Date: string;
  Contact: Contact[];
}

export interface Contact {
  id: number;
  Firstname: string;
  LastName: string;
  Photo: any;
  Organization: Organization[];
}

export interface Organization {
  id: number;
  Name: string;
  LogoURL: string;
}
