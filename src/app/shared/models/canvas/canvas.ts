export interface GetGPTActionDTO {
    contactId: number;
    canvasChats: CanvasChatDTO[];
  }
  
  export interface CanvasChatDTO {
    senderType: string;
    message: string;
    messageSendDate: Date;
  }
  