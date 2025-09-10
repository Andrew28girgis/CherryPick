export interface GetGPTActionDTO {
  contactId: any;
  canvasChats: CanvasChatDTO[];
}

export interface CanvasChatDTO {
  senderType: string;
  message: string;
  messageSendDate: string;
}


export interface AiResponse {
  actionDescription: string
  actionName: string
  params: any[]
  messageText: string
}
