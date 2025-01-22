    import { Injectable } from '@angular/core';
    import { HttpClient, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { GroqApiInterceptor } from '../groq-api-interceptor.interceptor';

    @Injectable({
    providedIn: 'root',
    })
    export class ChatHttpClient extends HttpClient {
    constructor(handler: HttpHandler) {
        super(handler);
    }

    static create(httpClient: HttpClient,handler: HttpHandler): ChatHttpClient {
        // Create an instance of the GroqApiInterceptor and wrap the handler
        const customHandler = new CustomHttpHandler(handler, new GroqApiInterceptor());
        return new ChatHttpClient(customHandler);
    }
    }


    /**
     * CustomHttpHandler class that applies the GroqApiInterceptor.
     */
    class CustomHttpHandler implements HttpHandler {
    constructor(private next: HttpHandler, private interceptor: GroqApiInterceptor) {}

    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
        return this.interceptor.intercept(req, this.next); // Apply the interceptor
    }
    }
