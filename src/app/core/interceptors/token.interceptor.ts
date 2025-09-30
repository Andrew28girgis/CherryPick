import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(request.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
    };
    const authRequest = request.clone({
      setHeaders: headers,
    });

    return next.handle(authRequest);
  }

  private shouldExclude(url: string): boolean {
    const excludedUrls = [
      'https://api.cherrypick.com/api/BuyBox/Login',
      'https://api.dropboxapi.com/2/file_requests/create',
      'https://content.dropboxapi.com/2/files/upload',
      'https://content.dropboxapi.com/2/files/download',
      'https://api.dropboxapi.com/2/files/delete_v2',
    ];
    return excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}
