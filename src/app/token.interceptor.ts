import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './shared/services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.shouldExclude(request.url)) {
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
      'https://api.cherrypick.com/api/BuyBox/Login'
    ];
    return excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}
