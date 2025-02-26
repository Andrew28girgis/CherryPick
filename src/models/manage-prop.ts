export interface Properties {
    id: number
    centerName: string
    centerAddress: string
    centerCity: string
    centerState: string
    zipCode: string
    mainImage: string
  }
  export interface IFile {
    name: string;
    type: string;
    content: string; // Base64-encoded image content
    selected?: boolean; // Add a selected property
  }