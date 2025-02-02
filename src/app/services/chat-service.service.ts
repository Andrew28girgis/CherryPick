import { Injectable } from "@angular/core"
import  { HttpClient, HttpHandler } from "@angular/common/http"
import { type Observable, throwError } from "rxjs"
import { catchError, map } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { ChatHttpClient } from "./chat-http-client"

interface AIResponse {
  type: string
  content: string
  data?: any
  error?: string
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
          role: "system",
          content: `
          You are a professional real estate AI assistant.\n\
  - Always provide helpful, accurate, and relevant information.\n\
  - Remember the context of the conversation: ${this.getFormattedContext()}.\n\
  - Reply strictly in HTML and CSS with a visually appealing design.\n\
  - Do not include any explanations, comments, or markdown formatting like \`\`\`html.\n\
  - Ensure all responses are well-structured, responsive, and aesthetically polished.\n\
  - Use color-coded sections, modern typography, shadows, and rounded corners.\n\
  - When applicable, include interactive elements such as charts, real-time updates, or dynamic UI components.\n\
  - The response should be fully functional as a standalone HTML page.\n\
  - Avoid unnecessary text—output only HTML, CSS, and minimal JavaScript if required for interactivity.\n\
  - All styling should be embedded within the response for easy use.
  -if you put images put them like this https://placehold.co/600x400 and change with and height`,
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

  generateSuggestions(lastResponse: string): Observable<string[]> {
    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            `make response like this <cthink> </think>[\"View more details\", \"Check nearby locations\", \"Filter by features\"]
             You are a professional real estate AI assistant. Generate 3 relevant follow-up questions or suggestions based on the last response. Provide these as a JSON array of strings.`,
        },
        { role: "assistant", content: lastResponse },
        { role: "user", content: "Generate 3 relevant follow-up suggestions that user can choose to ask you it based on your last response.(the siggestion not more than three words)" },
      ],
    }

    return this.chatHttpClient.post(this.apiUrl, body).pipe(
      map((response: any) => {
        if (response?.choices?.[0]?.message?.content) {
          try {
            const content = response.choices[0].message.content
            // Try to extract JSON from the content
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0])
            } else {
              console.error("No valid JSON found in the response")
              return []
            }
          } catch (error) {
            console.error("Error parsing suggestions:", error)
            return []
          }
        }
        return []
      }),
      catchError((error) => {
        console.error("Error generating suggestions:", error)
        return throwError(() => new Error("Failed to generate suggestions"))
      }),
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
    return this.parseContentToAIResponse(content)
  }

  private parseContentToAIResponse(content: string): AIResponse {
    try {
      const parsedContent = JSON.parse(content)
      if (typeof parsedContent === "object" && parsedContent !== null) {
        if (parsedContent.properties || parsedContent.listings) {
          return {
            type: "properties",
            content: "Here are the properties matching your criteria:",
            data: parsedContent,
          }
        } else if (parsedContent.analysis || parsedContent.summary) {
          return {
            type: "analysis",
            content: "Here's the analysis you requested:",
            data: parsedContent,
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
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`
      }
    }

    console.error("API Error:", error)

    return throwError(() => ({
      type: "error",
      content: errorMessage,
      data: null,
      error: error.message,
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

