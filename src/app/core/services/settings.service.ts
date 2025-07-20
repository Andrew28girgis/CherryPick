import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Stage {
  id: number;
  stageMessage: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private httpClient: HttpClient) {}

  getStageIdAndName(): Observable<Stage[]> {
    return this.httpClient.get<Stage[]>(
      `${environment.api}/Mails/GetStageIdAndName`
    );
  }

  getReadMailsStages(
    StageId: number,
    Guid: string
  ): Observable<{ totalMailCount: number }> {
    const body = { StageId: StageId, Guid: Guid };
    return this.httpClient.post<{ totalMailCount: number }>(
      `${environment.api}/Mails/GetReadMailsStages`,
      body
    );
  }

  removeDuplication(): Observable<{ countOfMails: number }> {
    return this.httpClient.get<{ countOfMails: number }>(
      `${environment.api}/Mails/RemoveDuplication `
    );
  }
}
