import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MicrosoftMailsService {
  constructor(private http: HttpClient) {}

  public GetContactFolders(ContactId: number) {
    return this.http.get<any>(
      `${environment.api}/MicrosoftMails/GetContactFolders?ContactId=${ContactId}`
    );
  }
  
  public AddFolderToBeRead(body: any) {
    return this.http.post<any>(
      `${environment.api}/MicrosoftMails/AddFolderToBeRead`,
      body
    );
  }

  public AddEmailsToBeRead(body: any) {
    return this.http.post<any>(
      `${environment.api}/MicrosoftMails/AddEmailsToBeRead`,
      body
    );
  }

  public AddDomainToBeRead(body: any) {
    return this.http.post<any>(
      `${environment.api}/MicrosoftMails/AddDomainToBeRead`,
      body
    );
  }

  public GetContactInfos(ContactId: number) {
    return this.http.get<any>(
      `${environment.api}/MicrosoftMails/GetContactInfos?ContactId=${ContactId}`
    );
  }

  public MyInbox(ContactId: number) {
    return this.http.get<any>(
      `${environment.api}/MicrosoftMails/MyInbox?ContactId=${ContactId}`
    );
  }

  public GetMailInfo(MailId: number) {
    return this.http.get<any>(
      `${environment.api}/MicrosoftMails/GetMailInfo?MailId=${MailId}`
    );
  }
}
