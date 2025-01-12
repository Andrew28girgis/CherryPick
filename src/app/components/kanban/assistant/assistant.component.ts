import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

interface AIResponse {
  content: string;
  type: 'text' | 'properties' | 'analysis' | 'report';
  data?: any;
}

interface AnalysisResult {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: File[];
  properties?: Property[];
  analysis?: AnalysisResult[];
  suggestions?: string[];
  isLoading?: boolean;
}

interface SuggestedPrompt {
  id: string;
  text: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  image: string;
}

interface PropertyAction {
  id: string;
  text: string;
  icon: string;
}
interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

interface ChatGroup {
  label: string;
  chats: ChatSession[];
}

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatHistoryContainer') chatHistoryContainer!: ElementRef;
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.showChatHistory) {
      this.toggleChatHistory();
    }
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showChatHistory && !this.chatHistoryContainer.nativeElement.contains(event.target)) {
      this.toggleChatHistory();
    }
  }
  messages: Message[] = [];
  newMessage = new FormControl('');
  isTyping = false;
  attachments: File[] = [];
  userName = 'Andrew';
  sidebarCollapsed = false;
  showInitialCards = true;
  selectedCard: 'file' | 'query' | null = null;
  showChatHistory = false;
  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  isLoading = false;



  suggestedPrompts: SuggestedPrompt[] = [
    { id: '1', text: 'Show me all available properties in Manhattan with at least 2,000 square feet' },
    { id: '2', text: 'Who are my top clients interested in commercial spaces?' },
    { id: '3', text: 'What follow-ups are pending for my last meeting with John Smith?' },
    { id: '4', text: 'Which properties are located near Five Guys within a 1-mile radius?' },
    { id: '5', text: 'What\'s the average rental rate in areas with high competition?' },
    { id: '6', text: 'Generate a report on properties with the highest rental yield' },
    { id: '7', text: 'Show me properties flagged as high financial risk' },
    { id: '8', text: 'Create a follow-up reminder for the client meeting scheduled next week' }
  ];

  properties: Property[] = [
    { id: '1', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '2', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '3', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '4', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '5', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: '/assets/Images/unit2.svg' },
    { id: '6', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '7', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '7', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },

  ];

  propertyActions: PropertyAction[] = [
    { 
      id: 'calculate',
      text: 'Calculate the rental yield for these properties',
      icon: 'calculator'
    },
    {
      id: 'demographics',
      text: 'Show the demographics and traffic data around these properties',
      icon: 'chart'
    },
    {
      id: 'tenants',
      text: 'List the nearby tenants for these properties',
      icon: 'users'
    }
  ];
  fileAnalysisPrompts: SuggestedPrompt[] = [
    { id: '1', text: 'Show me all available properties in Manhattan with at least 2,000 square feet.' },
    { id: '2', text: 'Who are my top clients interested in commercial spaces?' },
    { id: '3', text: '"What follow-ups are pending for my lead John Smith?' },
    { id: '4', text: 'Which properties are located near Five Guys within a 1-mile radius?' },
    { id: '5', text: 'What’s the average rental rate in areas with high competition?' },
    // { id: '6', text: '"Generate a report on properties with the highest rental yield.' },
    // { id: '7', text: 'Show me properties flagged as high financial risk.' },
    // { id: '8', text: 'Who are my top clients interested in commercial spaces?' },
    // { id: '9', text: 'Create a follow-up reminder for the client meeting scheduled next week.' }
  ];

  
  queryAssistantPrompts: SuggestedPrompt[] = [
    { id: '1', text: 'Show me all available properties in Manhattan with at least 2,000 square feet' },
    { id: '2', text: 'Who are my top clients interested in commercial spaces?' },
    { id: '3', text: 'What follow-ups are pending for my last meeting?' }
  ];
  private loadProperties(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
    }, 0);
  }
  ngOnInit(): void {
    this.loadChatSessions();
    this.scrollToBottom();
    this.loadProperties();
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private async generateAIResponse(prompt: string): Promise<AIResponse> {
    // Simulate AI processing - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (prompt.toLowerCase().includes('show') && prompt.toLowerCase().includes('properties')) {
      return {
        type: 'properties',
        content: 'Here are the properties matching your criteria:',
        data: this.properties
      };
    } else if (prompt.toLowerCase().includes('analysis') || prompt.toLowerCase().includes('report')) {
      return {
        type: 'analysis',
        content: 'Here\'s the analysis you requested:',
        data: [
          { title: 'Average Price', value: '$2.5M', trend: 'up' },
          { title: 'Total Properties', value: 127, trend: 'neutral' },
          { title: 'Market Growth', value: '5.2%', trend: 'up' }
        ]
      };
    } else if (prompt.toLowerCase().includes('calculate') && prompt.toLowerCase().includes('yield')) {
      return {
        type: 'analysis',
        content: 'Here are the rental yield calculations:',
        data: [
          { title: 'Average Yield', value: '7.2%', trend: 'up' },
          { title: 'Highest Yield', value: '8.5%', trend: 'up' },
          { title: 'Lowest Yield', value: '5.8%', trend: 'down' },
          { title: 'Market Average', value: '6.5%', trend: 'neutral' }
        ]
      };
    }

    return {
      type: 'text',
      content: `I understand you're asking about "${prompt}". Here's what I found...`,
      data: {
        suggestions: [
          'Would you like to see related properties?',
          'Should I generate a detailed report?',
          'Would you like to analyze market trends?'
        ]
      }
    };
  }

  async handleSend(): Promise<void> {
    if (!this.currentSession) {
      this.startNewChat();
    }    const messageContent = this.newMessage.value?.trim();
    if (!messageContent && this.attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent || '',
      sender: 'user',
      timestamp: new Date(),
      attachments: [...this.attachments]
    };

    this.messages.push(userMessage);
    this.newMessage.reset();
    this.attachments = [];
    this.isTyping = true;

    try {
      const aiResponse = await this.generateAIResponse(messageContent || '');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'assistant',
        timestamp: new Date(),
        properties: aiResponse.type === 'properties' ? aiResponse.data : undefined,
        analysis: aiResponse.type === 'analysis' ? aiResponse.data : undefined,
        suggestions: aiResponse.data?.suggestions
      };

      this.messages.push(assistantMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      this.messages.push({
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      });
    } finally {
      this.isTyping = false;
    }
    if (this.currentSession) {
      this.currentSession.messages = this.messages;
      
      // Update session title if it's the first message
      if (this.messages.length === 1) {
        this.currentSession.title = messageContent || 'New Chat';
      }
      
      // Save to localStorage
      this.saveChatSessions();
    }
  }
  private saveChatSessions(): void {
    localStorage.setItem('chatSessions', JSON.stringify(this.chatSessions));
  }

  private loadChatSessions(): void {
    const saved = localStorage.getItem('chatSessions');
    if (saved) {
      this.chatSessions = JSON.parse(saved);
      // Convert string dates back to Date objects
      this.chatSessions.forEach(session => {
        session.date = new Date(session.date);
      });
    }
  }

  handleFileInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files) {
      this.attachments = [...this.attachments, ...Array.from(element.files)];
    }
  }

  removeAttachment(file: File): void {
    this.attachments = this.attachments.filter(f => f !== file);
  }

  selectPrompt(prompt: SuggestedPrompt): void {
    this.newMessage.setValue(prompt.text);
    this.handleSend();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  handlePropertyAction(actionId: string): void {
    const action = this.propertyActions.find(a => a.id === actionId);
    if (action) {
      this.newMessage.setValue(action.text);
      this.handleSend();
    }
  }
  selectCard(type: 'file' | 'query'): void {
    this.showInitialCards = false;
    this.selectedCard = type;
  }
  // Method to toggle chat history
  toggleChatHistory(): void {
    this.showChatHistory = !this.showChatHistory;
    if (this.showChatHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // Method to group chats by date
  get groupedChats(): ChatGroup[] {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [
      {
        label: 'Today',
        chats: this.chatSessions.filter(chat => 
          chat.date.toDateString() === today.toDateString()
        )
      },
      {
        label: 'Yesterday',
        chats: this.chatSessions.filter(chat => 
          chat.date.toDateString() === yesterday.toDateString()
        )
      },
      {
        label: 'Older',
        chats: this.chatSessions.filter(chat => 
          chat.date < yesterday && 
          chat.date.toDateString() !== today.toDateString()
        )
      }
    ].filter(group => group.chats.length > 0);
  }

  // Method to select a chat session
  
// Update selectSession to close the dropdown after selection
selectSession(session: ChatSession): void {
  this.currentSession = session;
  this.messages = session.messages;
  this.showChatHistory = false;
  this.scrollToBottom();
}

  // Method to start a new chat
  startNewChat(): void {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      date: new Date(),
      messages: []
    };
    
    this.chatSessions.unshift(newSession);
    this.currentSession = newSession;
    this.messages = [];
    this.showInitialCards = true;
    this.showChatHistory = false;
  }
}