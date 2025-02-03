import { Component,  OnInit, ViewChild,  ElementRef,  AfterViewChecked } from "@angular/core"
import { FormControl } from "@angular/forms"
import { trigger, transition, style, animate } from "@angular/animations"
import  { ChatService } from "../../../services/chat-service.service"
import  { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import  {
  Message,
  SuggestedPrompt,
  Property,
  PropertyAction,
  ChatSession,
  ChatGroup,
} from "../../../../models/chatbot"

@Component({
  selector: "app-assistant",
  templateUrl: "./assistant.component.html",
  styleUrls: ["./assistant.component.css"],
  animations: [
    trigger("fadeSlide", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate("200ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
      transition(":leave", [animate("200ms ease-in", style({ opacity: 0, transform: "translateY(20px)" }))]),
    ]),
  ],
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild("chatHistoryContainer") chatHistoryContainer!: ElementRef
  @ViewChild("messagesEnd") private messagesEnd!: ElementRef
  @ViewChild("fileInput") private fileInput!: ElementRef<HTMLInputElement>

  messages: Message[] = []
  newMessage = new FormControl("")
  isTyping = false
  attachments: File[] = []
  userName = "Andrew"
  sidebarCollapsed = false
  showInitialCards = true
  selectedCard: "file" | "query" | null = null
  showChatHistory = false
  chatSessions: ChatSession[] = []
  currentSession: ChatSession | null = null
  isLoading = false
  conversationContext: string[] = []
  showScrollButton = false
  intelligentSuggestions: string[] = []

  suggestedPrompts: SuggestedPrompt[] = [
    { id: "1", text: "Show me all available properties in Manhattan with at least 2,000 square feet" },
    { id: "2", text: "Who are my top clients interested in commercial spaces?" },
    { id: "3", text: "What follow-ups are pending for my last meeting with John Smith?" },
    { id: "4", text: "Which properties are located near Five Guys within a 1-mile radius?" },
    { id: "5", text: "What's the average rental rate in areas with high competition?" },
    { id: "6", text: "Generate a report on properties with the highest rental yield" },
    { id: "7", text: "Show me properties flagged as high financial risk" },
    { id: "8", text: "Create a follow-up reminder for the client meeting scheduled next week" },
  ]

  properties: Property[] = [
    { id: "1", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit.svg" },
    { id: "2", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit2.svg" },
    { id: "3", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit2.svg" },
    { id: "4", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit.svg" },
    { id: "5", name: "Unit 0 Mall of America", location: "Washington, DC", image: "/assets/Images/unit2.svg" },
    { id: "6", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit.svg" },
    { id: "7", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit2.svg" },
    { id: "8", name: "Unit 0 Mall of America", location: "Washington, DC", image: "assets/Images/unit2.svg" },
  ]

  propertyActions: PropertyAction[] = [
    {
      id: "calculate",
      text: "Calculate the rental yield for these properties",
      icon: "calculator",
    },
    {
      id: "demographics",
      text: "Show the demographics and traffic data around these properties",
      icon: "chart",
    },
    {
      id: "tenants",
      text: "List the nearby tenants for these properties",
      icon: "users",
    },
  ]

  fileAnalysisPrompts: SuggestedPrompt[] = [
    { id: "1", text: "Show me all available properties in Manhattan with at least 2,000 square feet." },
    { id: "2", text: "Who are my top clients interested in commercial spaces?" },
    { id: "3", text: "What follow-ups are pending for my lead John Smith?" },
    { id: "4", text: "Which properties are located near Five Guys within a 1-mile radius?" },
    { id: "5", text: "What's the average rental rate in areas with high competition?" },
  ]

  queryAssistantPrompts: SuggestedPrompt[] = [
    { id: "1", text: "Show me all available properties in Manhattan with at least 2,000 square feet" },
    { id: "2", text: "Who are my top clients interested in commercial spaces?" },
    { id: "3", text: "What follow-ups are pending for my last meeting?" },
  ]

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadChatSessions()
    this.scrollToBottom()
    this.loadProperties()
    // Load saved sidebar state
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState)
    }
  }

  ngAfterViewChecked(): void {
    if (this.messages) {
      this.scrollToBottom()
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: "smooth" })
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }

  private loadProperties(): void {
    this.isLoading = true
    setTimeout(() => {
      this.isLoading = false
    }, 0)
  }

  async handleSend(): Promise<void> {
    if (!this.currentSession) {
      this.startNewChat()
    }
    const messageContent = this.newMessage.value?.trim()
    if (!messageContent && this.attachments.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent || "",
      sender: "user",
      timestamp: new Date(),
      attachments: [...this.attachments],
    }

    this.messages.push(userMessage)
    this.newMessage.reset()
    this.attachments = []
    this.isTyping = true

    try {
      const aiResponse = await this.chatService.generateAIResponse(messageContent || "").toPromise()

      if (aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.content,
          formattedContent: this.formatMessage(aiResponse.content),
          sender: "assistant",
          timestamp: new Date(),
          properties: aiResponse.type === "properties" ? aiResponse.data : undefined,
          analysis: aiResponse.type === "analysis" ? aiResponse.data : undefined,
        }
        this.messages.push(assistantMessage)
        this.intelligentSuggestions = aiResponse.suggestions || []
      } else {
        this.handleErrorResponse("AI response is undefined")
      }
    } catch (error: any) {
      this.handleErrorResponse(error.content || "Error generating AI response")
    } finally {
      this.isTyping = false
      this.updateCurrentSession(messageContent || null)
    }

    this.conversationContext.push(messageContent || "")

    if (this.conversationContext.length > 5) {
      this.conversationContext.shift()
    }
  }

  private handleErrorResponse(errorMessage: string): void {
    console.error(errorMessage)
    this.messages.push({
      id: (Date.now() + 1).toString(),
      content: errorMessage,
      sender: "assistant",
      timestamp: new Date(),
    })
  }

  private saveChatSessions(): void {
    localStorage.setItem("chatSessions", JSON.stringify(this.chatSessions))
  }

  private loadChatSessions(): void {
    const saved = localStorage.getItem("chatSessions")
    if (saved) {
      this.chatSessions = JSON.parse(saved)
      this.chatSessions.forEach((session) => {
        session.date = new Date(session.date)
      })
    }
  }

  handleFileInput(event: Event): void {
    const element = event.target as HTMLInputElement
    if (element.files) {
      this.attachments = [...this.attachments, ...Array.from(element.files)]
    }
  }

  removeAttachment(file: File): void {
    this.attachments = this.attachments.filter((f) => f !== file)
  }

  selectPrompt(prompt: string | SuggestedPrompt): void {
    const promptText = typeof prompt === "string" ? prompt : prompt.text
    this.newMessage.setValue(promptText)
    this.handleSend()
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click()
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed))
  }

  handlePropertyAction(actionId: string): void {
    const action = this.propertyActions.find((a) => a.id === actionId)
    if (action) {
      this.newMessage.setValue(action.text)
      this.handleSend()
    }
  }

  selectCard(type: "file" | "query"): void {
    this.showInitialCards = false
    this.selectedCard = type
  }

  toggleChatHistory(): void {
    this.showChatHistory = !this.showChatHistory
    document.body.style.overflow = this.showChatHistory ? "hidden" : ""
  }

  get groupedChats(): ChatGroup[] {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    return [
      {
        label: "Today",
        chats: this.chatSessions.filter((chat) => chat.date.toDateString() === today.toDateString()),
      },
      {
        label: "Yesterday",
        chats: this.chatSessions.filter((chat) => chat.date.toDateString() === yesterday.toDateString()),
      },
      {
        label: "Older",
        chats: this.chatSessions.filter(
          (chat) => chat.date < yesterday && chat.date.toDateString() !== today.toDateString(),
        ),
      },
    ].filter((group) => group.chats.length > 0)
  }

  selectSession(session: ChatSession): void {
    this.currentSession = session
    this.messages = session.messages
    this.showChatHistory = false
    this.scrollToBottom()
  }

  startNewChat(): void {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      date: new Date(),
      messages: [],
    }

    this.chatSessions.unshift(newSession)
    this.currentSession = newSession
    this.messages = []
    this.showInitialCards = true
    this.showChatHistory = false
    this.conversationContext = []
    this.chatService.clearConversationContext()
  }

  private updateCurrentSession(messageContent: string | null): void {
    if (this.currentSession) {
      this.currentSession.messages = this.messages

      if (this.messages.length === 2) {
        this.currentSession.title = messageContent || "New Chat"
      }

      this.saveChatSessions()
    }
  }

  isThinkContent(content: string): boolean {
    return content.includes("<think>") && content.includes("</think>")
  }

  formatMessage(content: string): SafeHtml {
    if (this.isThinkContent(content)) {
      const parts = content.split("</think>")
      if (parts.length === 2) {
        const responseContent = parts[1].trim()
        const formattedContent = `
          <div class="response-content">
            <div class="message-text">${responseContent}</div>
          </div>
        `
        return this.sanitizer.bypassSecurityTrustHtml(formattedContent)
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(
      `<div class="response-content"><div class="message-text">${content}</div></div>`,
    )
  }
}

