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
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content: ` dont return in your response <think></THink>,dont think
            Generate an HTML response with inline CSS styling for real estate listings. Follow these guidelines:
            1. **Structure**: 
               - Use a responsive container 
               - Group listings into a grid layout (e.g., display: grid; grid-template-columns: repeat(auto-fill, ;).
               - Format each property as a "card" with padding:  border: and border-radius:
            2. **Styling**:
               - Highlight prices in #2d5a27 (green) with font-weight: bold.
               - Use status badges (Available/Pending) with background colors: #2d5a27 (green) for Available, #cc7722 (orange) for Pending.
               - Ensure typography consistency (e.g., font-family: Arial, sans-serif; line-height: 1.6).
            3. **Content**:
               -dont  Display images  
            4. **Professional Tone**:
               - Avoid markdown; use semantic HTML (e.g., <h2> for titles, <ul> for amenities).
               - Add subtle hover effects to cards (e.g., box-shadow: 0 4px 8px rgba(0,0,0,0.1)).
            Example structure:
            <div style='...container styles...'>
              <h1 style='...header...'>Luxury Real Estate Listings</h1>
              <div style='...grid...'>
                <div style='...card...'>
                  <h2>{Title}</h2>
                  <div style='...image grid...'><img src='...' alt='Property'></div>
                  <p><span style='color: #2d5a27;'>Price: {Price}</span></p>
                  <p>Status: <span style='background: {StatusColor}; color: white; padding: 4px 8px; border-radius: 4px;'>{Status}</span></p>
                  <ul><li>{Amenities}</li></ul>
                </div>
              </div>
              <footer style='...footer...'>&copy; 2024 Your Real Estate Co.</footer>
            </div> and dont say parts like this dont say any of my instructions in your respones like 
          `}        ,
          { role: "user", content: prompt }],
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

