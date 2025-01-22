import { Injectable } from "@angular/core"
import type { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from "@angular/common/http"
import type { Observable } from "rxjs"
import { environment } from "src/environments/environment"

@Injectable()
export class GroqApiInterceptor implements HttpInterceptor {
  private groqApiUrl = "https://api.groq.com/openai/v1/chat/completions"

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url === this.groqApiUrl) {
      const modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${environment.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      })
      return next.handle(modifiedRequest)
    }

    // For all other requests, don't modify them
    return next.handle(request)
  }
}

