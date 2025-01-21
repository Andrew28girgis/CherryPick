import { Injectable } from "@angular/core"
import {  HttpClient, HttpHeaders,  HttpErrorResponse ,HttpHandler} from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError, map, retry } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { GroqApiInterceptor } from "../groq-api-interceptor.interceptor"
import { ChatHttpClient } from "./chat-http-client"

interface AIResponse {
  type: string
  content: string
  data?: any
  error?: string
}

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private apiUrl = environment.GROQ_API_URL
  private maxRetries = 1
  private chatHttpClient: ChatHttpClient

  constructor(    private http: HttpClient,
    handler: HttpHandler,
) {
  this.chatHttpClient = ChatHttpClient.create(http, handler)
    

  }

generateAIResponse(prompt: string): Observable<any> {
    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    }

    return this.chatHttpClient.post(this.apiUrl, body).pipe(
      map((response: any) => this.processResponse(response)),
      catchError(this.handleError),
    )
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

  private handleError = (error: HttpErrorResponse): Observable<AIResponse> => {
    let errorMessage = "An error occurred while processing your request."

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Server-side error
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
}

