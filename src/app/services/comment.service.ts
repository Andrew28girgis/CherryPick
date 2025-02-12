import { Injectable } from "@angular/core"
import  { HttpClient, HttpErrorResponse } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError, map } from "rxjs/operators"


interface Comment {
    id: number;
    text: string;
    userId: string;
    shoppingCenterId: number;
    parentId: number | null;
    createdAt: Date;
    replies?: Comment[];
  }

@Injectable({
  providedIn: "root",
})
export class CommentService {
  private apiUrl = "https://your-api-url.com/api" // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  getComments(shoppingCenterId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/comments?shoppingCenterId=${shoppingCenterId}`).pipe(
      map((comments) => comments.map((comment) => this.parseComment(comment))),
      catchError(this.handleError),
    )
  }

  addComment(comment: Comment): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments`, comment).pipe(
      map((response) => this.parseComment(response)),
      catchError(this.handleError),
    )
  }

  updateComment(comment: Comment): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/${comment.id}`, comment).pipe(
      map((response) => this.parseComment(response)),
      catchError(this.handleError),
    )
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`).pipe(catchError(this.handleError))
  }

  private parseComment(comment: any): Comment {
    return {
      ...comment,
      createdAt: new Date(comment.createdAt),
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred!"
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`
    }
    console.error(errorMessage)
    return throwError(() => new Error(errorMessage))
  }
}

