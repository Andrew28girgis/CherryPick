// import { environment } from 'src/environments/environment';
// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';

// interface Comment {
//   id: number;
//   text: string;
//   user: string;
//   parentId: number | null;
//   replies: Comment[];
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class SocialMedialService {
//   private showReactionsSubject = new BehaviorSubject<{[key: number]: boolean}>({});
//   private reactionsSubject = new BehaviorSubject<{[key: number]: string}>({});
//   private commentsSubject = new BehaviorSubject<{[key: number]: Comment[]}>({});
//   private showCommentsSubject = new BehaviorSubject<{[key: number]: boolean}>({});
  
//   showReactions$ = this.showReactionsSubject.asObservable();
//   reactions$ = this.reactionsSubject.asObservable();
//   comments$ = this.commentsSubject.asObservable();
//   showComments$ = this.showCommentsSubject.asObservable();

//   toggleReactions(shoppingId: number): void {
//     const currentState = this.showReactionsSubject.value;
//     this.showReactionsSubject.next({
//       ...currentState,
//       [shoppingId]: !currentState[shoppingId]
//     });
//   }

//   react(shoppingId: number, reactionType: string): void {
//     const currentReactions = this.reactionsSubject.value;
//     this.reactionsSubject.next({
//       ...currentReactions,
//       [shoppingId]: reactionType
//     });
//     this.showReactionsSubject.next({
//       ...this.showReactionsSubject.value,
//       [shoppingId]: false
//     });
//   }

//   likeDirectly(shoppingId: number): void {
//     const currentReactions = this.reactionsSubject.value;
//     const newReaction = currentReactions[shoppingId] === 'Like' ? '' : 'Like';
//     this.reactionsSubject.next({
//       ...currentReactions,
//       [shoppingId]: newReaction
//     });
//   }

//   getReaction(shoppingId: number): string {
//     return this.reactionsSubject.value[shoppingId] || '';
//   }

//   getTotalReactions(shoppingId: number): number {
//     return this.reactionsSubject.value[shoppingId] ? 1 : 0;
//   }

//   getPrimaryReaction(shoppingId: number): string {
//     return this.reactionsSubject.value[shoppingId] || 'Like';
//   }

//   toggleComments(shoppingId: number): void {
//     const currentState = this.showCommentsSubject.value;
//     this.showCommentsSubject.next({
//       ...currentState,
//       [shoppingId]: !currentState[shoppingId]
//     });
//   }

//   addComment(shoppingId: number, commentText: string): void {
//     const currentComments = this.commentsSubject.value;
//     const shoppingComments = currentComments[shoppingId] || [];
//     const newComment: Comment = {
//       id: Date.now(),
//       text: commentText,
//       user: 'Current User',
//       parentId: null,
//       replies: [],
//     };
//     this.commentsSubject.next({
//       ...currentComments,
//       [shoppingId]: [...shoppingComments, newComment]
//     });
//   }

//   addReply(shoppingId: number, parentId: number, replyText: string): void {
//     const currentComments = this.commentsSubject.value;
//     const shoppingComments = currentComments[shoppingId] || [];
//     const newReply: Comment = {
//       id: Date.now(),
//       text: replyText,
//       user: 'Current User',
//       parentId: parentId,
//       replies: [],
//     };
//     const updatedComments = this.addReplyToComment(shoppingComments, parentId, newReply);
//     this.commentsSubject.next({
//       ...currentComments,
//       [shoppingId]: updatedComments
//     });
//   }

//   private addReplyToComment(comments: Comment[], parentId: number, newReply: Comment): Comment[] {
//     return comments.map(comment => {
//       if (comment.id === parentId) {
//         return {
//           ...comment,
//           replies: [...comment.replies, newReply]
//         };
//       }
//       if (comment.replies.length > 0) {
//         return {
//           ...comment,
//           replies: this.addReplyToComment(comment.replies, parentId, newReply)
//         };
//       }
//       return comment;
//     });
//   }

//   // Add methods for sharing functionality here
//   shareContent(shopping: any): void {
//     // Implement sharing logic here
 
//   }

//   copyLinkSocial(shopping: any): void {
//     const link = `localhost:4200/landing/0/${shopping.Id}/${shopping.BuyBoxId}/${shopping.OrgId}`;
//     navigator.clipboard.writeText(link).then(() => {
//     }, (err) => {
//     });
//   }
// }
























import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import {  Observable, BehaviorSubject } from "rxjs"
import { map } from "rxjs/operators"
import { environment } from "src/environments/environment"

interface Comment {
  id: number
  marketSurveyId: number
  text: string
  replies: Comment[]
}

@Injectable({
  providedIn: "root",
})
export class SocialMedialService {
  private apiUrl = environment.api

  private reactionsSubject = new BehaviorSubject<{ [key: number]: string }>({})
  private commentsSubject = new BehaviorSubject<{ [key: number]: Comment[] }>({})

  constructor(private http: HttpClient) {}

  // Reactions
  toggleReactions(marketSurveyId: number): void {
    // This method doesn't need API integration, it's UI-specific
  }

  react(marketSurveyId: number, reactionType: string): Observable<any> {
    return this.http.put(`${this.apiUrl}marketSurvey/${marketSurveyId}/reactions.json`, JSON.stringify(reactionType))
  }

  getReaction(marketSurveyId: number): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}marketSurvey/${marketSurveyId}/reactions.json`)
  }

  getTotalReactions(marketSurveyId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/marketSurvey/${marketSurveyId}/reactions/count`)
  }

  // Comments
  createComment(marketSurveyId: number, comment: string, parentCommentId?: number): Observable<Comment> {
    const payload = {
      MarketSurveyId: marketSurveyId,
      Comment: comment,
      ParentCommentId: parentCommentId || null,
    }
    return this.http.post<Comment>(`${this.apiUrl}/comments`, payload)
  }

  getComments(marketSurveyId: number): Observable<Comment[]> {
    return this.http
      .get<{ [key: string]: Comment }>(`${this.apiUrl}marketSurvey/${marketSurveyId}/comments.json`)
      .pipe(map((response) => (response ? Object.values(response) : [])))
  }

  // This method is now a wrapper around createComment
  addComment(marketSurveyId: number, text: string): Observable<Comment> {
    return this.createComment(marketSurveyId, text)
  }

  // This method is now a wrapper around createComment
  addReply(marketSurveyId: number, parentId: number, text: string): Observable<Comment> {
    return this.createComment(marketSurveyId, text, parentId)
  }

  private addReplyToComment(comments: Comment[], parentId: number, newReply: Comment): Comment[] {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...comment.replies, newReply] }
      }
      if (comment.replies.length > 0) {
        return { ...comment, replies: this.addReplyToComment(comment.replies, parentId, newReply) }
      }
      return comment
    })
  }

  // Sharing
  shareContent(marketSurvey: any): Observable<any> {
    const shareData = {
      title: marketSurvey.CenterName,
      text: `Check out ${marketSurvey.CenterName}!`,
      address: marketSurvey.CenterAddress,
      url: `${window.location.origin}/landing/0/${marketSurvey.Id}/${marketSurvey.BuyBoxId}/${marketSurvey.OrgId}`,
    }
    return this.http.post(`${this.apiUrl}shares.json`, shareData)
  }

  // Utility methods
  copyLinkSocial(marketSurvey: any): string {
    return `${window.location.origin}/landing/0/${marketSurvey.Id}/${marketSurvey.BuyBoxId}/${marketSurvey.OrgId}`
  }
}

