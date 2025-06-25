// src/app/services/dropbox.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, from, Observable, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UploadArgs {
  path: string; // e.g. "/File Requests/Homework/andrew.json"
  mode: 'add' | 'overwrite' | 'update';
  autorename: boolean;
  mute?: boolean;
  strict_conflict?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DropboxService {
  private readonly UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
  private tokenSubject = new BehaviorSubject<string>('');// Initialize with empty token
  // Public observable for components to subscribe to token changes
  currentToken$ = this.tokenSubject.asObservable();

  token!:string;
  RefreshToken!:string;
  // token = 'sl.u.AFwv-6iryU1MlXbUp6wddb6eZzo-LlyMm5J1IgGGU4Kdtp-Kt7GRDWL1LWmf9eN_pF5SOhIj6V8leKthhqWBSDAQkQzDXUZmbuHb2hXNa5czf8Ss0pwvPkOgeD9y9LFnRzNj38BmgPNmz4fsIYVbD8TtBs1uv4PjqUuloyRggwo2tcPyNNG0A53iQaxr6gYlghHxnEWQJwcnBiZElTJlFB7UhB052FR0w1I0SIxHAofNwTVB7ms5abETdaoOVz8l3SKISPnsUx4OpH7BJnZky7XJIiVhEwJv2eMs-o9Rs3cYuhMP3ScmSYTS10Cr5PIZ9PSWqSLRnNi46C1S_u-k9pzm4ysoGMVC-UDLejToswMqws_GzfjMF1fwwaRDL8agXh5FrK50VIEwTx4J-9A39yUSxYV7V7NY-yRSLFLgWIfqnbzKkIzIZ5LjyWHZAIJmifHHbXFEfXGF0kSMBkxZD3vDVbSI421vpSWHIxzdD5muR8xyN6GP4d85SpFejcmye5yTJW6iS3KaqubI3K8A08rCcLjaYjZBGyhRc3D4kqWY-TIoUlwosI6VrjBSedfDmgZX3Xiq-xaeT4fOzBpo1dnm0TCdCM0xGrlgzm4WxfmnSqqI4QLVrCuN19tjK-oxG3zDfJoYK-xetdQBFmRT_JR1Rn2nf9IMrn8VOdRGetHvP-B7J4Eut1SiI5JVYdRt0IfAj1TXAPfR2uxeKitXi33-6SGR7_kUPzLP1e5QDaJQdL4tbb17yKIC_Vjg4VS6Vf7KufCD-r71L2eBUsiBj7SbnWDxZx20JLXJKM97Uo6xdJ1zheaaUMyvdnRA-olAozkc-cFSQdZs2maPXsYHL_ASBhy6revnARm5GDRcq4iPi8d0MrNu4B0cqoXeQ1J8R74vsU1XgG-XzGAPrVGc_R7hZDxz88XyRwMP8EaymYI88qOAEO7U1A_zrGdmCFPr5yJcl1n_JKqJg6Bn305T6LQVnoXCBO9Ct5xekOkGlKRPjL4F6KDhhoz1RZ0_A1a64SA0htDgDwM-u3dlV6HEtOZyIQ02Y8Ao2noRcL6l2TqE1YHTZ4fvbPht98m2bPiQSIiPC0hA8LAA9Q0xKGziups8sSLkAsOuk3KYY01EwlAqErU7E2_w3A_GzBe7x6QzpIwjVaRKUuf9n8z46VnM9fcq1Ifk3BZBuf8DUhOaqqKc-a4aOIO4bhaJzr7J92AvjYmkpnkZhgTt9xNSXfzkc4Ut--mFrD98icrr4zZXaltaquvgwHt_CC6QZT5b1QtB4FAB3YzcjLoLdOAW1LEd3j7W';
  constructor(private http: HttpClient) {}

  setToken(token: string): void {
    this.tokenSubject.next(token);
    console.log('token set in dropbox service', token);
    this.token = token;
  }

  setRefreshToken(token: string): void {
     this.tokenSubject.next(token);
    console.log('refresh token dropbox service', token);
    this.RefreshToken = token; 
  }

  uploadFile(fileBlob: Blob, dropboxPath: string): Observable<string> {
    const args = {
      path: dropboxPath,
      mode: 'overwrite',
      autorename: false,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify(args),
    });

    return this.http.post(this.UPLOAD_URL, fileBlob, {
      headers,
      responseType: 'text',
    });
  }

 downloadFile(path: string): Observable<string> {
    const downloadUrl = 'https://content.dropboxapi.com/2/files/download';
    console.log('tokenSubject',this.tokenSubject);
    console.log('token',this.token);
    console.log('RefreshToken',this.RefreshToken);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Dropbox-API-Arg': JSON.stringify({ path })
    });

    return this.http.post(downloadUrl, null, {
      headers,
      responseType: 'text'
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => {
              // Retry with new token
              const newHeaders = new HttpHeaders({
                'Authorization': `Bearer ${this.token}`,
                'Dropbox-API-Arg': JSON.stringify({ path })
              });
              return this.http.post(downloadUrl, null, {
                headers: newHeaders,
                responseType: 'text'
              });
            })
          );
        }
        return throwError(error);
      })
    );
  }

  private refreshToken(): Observable<any> {
    const url = `${environment.api}/DropBox/GetNewAccessToken`;
    const headers = new HttpHeaders({
      'accept': 'application/json',
      'Content-Type': 'application/json-patch+json'
    });
    // The API expects the refresh token as a JSON string in the body
    return this.http.post(url, JSON.stringify(this.RefreshToken), { headers });
  }

  deleteFile(path: string) {
    const dropboxApiUrl = 'https://api.dropboxapi.com/2/files/delete_v2';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    });

    const body = { path };

    return this.http.post(dropboxApiUrl, body, {
      headers,
      responseType: 'json',
    });
  }
}
