import { SafeHtml } from "@angular/platform-browser";

export interface AnalysisResult {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}
export interface Message {
  id: string;
  content: string;
  formattedContent?: SafeHtml;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: File[];
  properties?: Property[];
  analysis?: AnalysisResult[];
  suggestions?: string[];
  isLoading?: boolean;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  image: string;
}

export interface PropertyAction {
  id: string;
  text: string;
  icon: string;
}
export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

export interface ChatGroup {
  label: string;
  chats: ChatSession[];
}
export interface AIResponse {
  type: string;
  content: string;
  data?: any;
  error?: string;
}
