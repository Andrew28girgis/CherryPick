import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.shouldExclude(request.url)) {
      // If the URL is excluded, proceed without adding the token
      return next.handle(request);
    }

    const token = this.authService.getToken();

    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return next.handle(authRequest);
  }

  private shouldExclude(url: string): boolean {
    const excludedUrls = [
      'https://10.0.0.15:8082/api/BuyBox/Login', // Login API
      'https://10.0.0.15:8082/api/BuyBox/GetSharedPlace',
      'https://api.capsnap.ai/api/BuyBox/GetSharedPlace',
    ];
    return excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}
