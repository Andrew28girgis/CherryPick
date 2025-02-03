import { Injectable } from "@angular/core"
import  { HttpClient, HttpHandler } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError, map } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { ChatHttpClient } from "./chat-http-client"

interface AIResponse {
  type: string
  content: string
  data?: any
  error?: string
  suggestions?: string[]
}

interface ContextMessage {
  role: "user" | "assistant"
  content: string
}

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private apiUrl = environment.GROQ_API_URL
  private chatHttpClient: ChatHttpClient
  private conversationContext: ContextMessage[] = []

  constructor(
    private http: HttpClient,
    handler: HttpHandler,
  ) {
    this.chatHttpClient = ChatHttpClient.create(http, handler)
  }

  generateAIResponse(prompt: string): Observable<any> {
    this.addToContext("user", prompt)

    if (this.conversationContext.length > 5) {
      this.conversationContext.shift()
    }

    const body = {
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          //   - When applicable, include interactive elements such as charts, real-time updates, or dynamic UI components.\n\

          role: "system",
          content: `
          You are a professional real estate AI assistant.\n\
  - Always provide helpful, accurate, and relevant information.\n\
  - Remember the context of the conversation: ${this.getFormattedContext()}.\n\
  -only when it needs to make that if its a simple talk dont do that  Reply strictly in HTML and CSS with a visually appealing design make your styles inline or with ids not classes because it override my page styles .\n\
  - Do not include any explanations, comments, or markdown formatting like \`\`\`html.\n\
  - Ensure all responses are well-structured, responsive, and aesthetically polished.\n\
  - Use color-coded sections, modern typography, shadows, and rounded corners.\n\
  - The response should be fully functional as a standalone HTML page.\n\
  - Avoid unnecessary text—output only HTML, CSS, and minimal JavaScript if required for interactivity.\n\
  - All styling should be embedded within the response for easy use.
  -if you put images put them like this https://placehold.co/600x400 and change with and height
  -Generate 3 relevant follow-up questions or suggestions each one don't exceed 3 words based on the last response. Provide these as a JSON array of strings at the end of response like this  like this [\"suggestion\", \"suggestion\", \"suggestion\"] `,
        },
        ...this.conversationContext,
        { role: "user", content: prompt },
      ],
    }

    return this.chatHttpClient.post(this.apiUrl, body).pipe(
      map((response: any) => {
        const processedResponse = this.processResponse(response)
        const responseContent = this.extractResponseContent(processedResponse.content)
        this.addToContext("assistant", responseContent)
        return processedResponse
      }),
      catchError(this.handleError),
    )
  }

  private addToContext(role: "user" | "assistant", content: string): void {
    this.conversationContext.push({ role, content })
    const userMessages = this.conversationContext.filter((msg) => msg.role === "user").slice(-5)
    const assistantMessages = this.conversationContext.filter((msg) => msg.role === "assistant").slice(-5)
    this.conversationContext = [...userMessages, ...assistantMessages].sort(
      (a, b) => this.conversationContext.indexOf(a) - this.conversationContext.indexOf(b),
    )
  }

  private getFormattedContext(): string {
    return this.conversationContext.map((msg) => `${msg.role}: ${msg.content}`).join(" | ")
  }

  private processResponse(response: any): AIResponse {
    console.log("API Response:", response)
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error("Invalid API response structure")
    }

    const content = response.choices[0].message.content
    const { mainContent, suggestions } = this.extractContentAndSuggestions(content)
    return this.parseContentToAIResponse(mainContent, suggestions)
  }

  private extractContentAndSuggestions(content: string): { mainContent: string; suggestions: string[] } {
    const parts = content.split(/\[.*?\]/)
    const mainContent = parts[0].trim()
    const suggestionsMatch = content.match(/\[(.*?)\]/)
    const suggestions = suggestionsMatch ? JSON.parse(`[${suggestionsMatch[1]}]`) : []
    return { mainContent, suggestions }
  }

  private parseContentToAIResponse(content: string, suggestions: string[]): AIResponse {
    try {
      const parsedContent = JSON.parse(content)
      if (typeof parsedContent === "object" && parsedContent !== null) {
        if (parsedContent.properties || parsedContent.listings) {
          return {
            type: "properties",
            content: "Here are the properties matching your criteria:",
            data: parsedContent,
            suggestions,
          }
        } else if (parsedContent.analysis || parsedContent.summary) {
          return {
            type: "analysis",
            content: "Here's the analysis you requested:",
            data: parsedContent,
            suggestions,
          }
        }
      }
    } catch (error) {
      // If parsing fails, treat as plain text
    }

    // Default to text response
    return {
      type: "text",
      content: content,
      data: null,
      suggestions,
    }
  }

  private handleError = (error: any): Observable<AIResponse> => {
    let errorMessage = "An error occurred while processing your request."

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    } else {
      if (error.status === 401) {
        errorMessage = "Authentication failed. Please check your API key."
      } else if (error.error && error.error.error) {
        errorMessage = `Error: ${error.error.error.message}`
      } else {
        errorMessage = "sorry tryagain later"
      }
    }

    console.error("API Error:", error)

    return throwError(() => ({
      type: "error",
      content: errorMessage,
      data: null,
      error: "sorry tryagain later",
    }))
  }

  clearConversationContext(): void {
    this.conversationContext = []
  }

  private extractResponseContent(fullContent: string): string {
    const thinkEndIndex = fullContent.lastIndexOf("</think>")
    if (thinkEndIndex !== -1) {
      return fullContent.substring(thinkEndIndex + 8).trim()
    }
    return fullContent
  }
}

