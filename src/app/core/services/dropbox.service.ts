// src/app/services/dropbox.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  token =
    'sl.u.AFzECtK8GbNnNjqkcM0TVVJsB1fKjLXbk0GgyhWBkAMzUO_2kJZTBwysH__wbjTkpwZTHoxbKTynPvMhxxq8-7whkhqkXM_295SCB7bTOEs5hUYdPqLo0S3VqYFZV7YcWdpmAHBg79-GnV2rLKeqlH2yTcqTp7uOonnLEN-rYPz4iFx3npkBrmx7B3jd2Dj6vWWs9BhONzCv9JJfPgQ-sM3bW05dyLuAJbVB0bDzxu03lzTXNUs-AXEOmgyJAF8X4_ROVPM6ZlLU8eIQNbUUCrjkwYrrsjTPQMs0WCmEFOw9GG53S5TCJATdl3YtckX3iUebp-GvxoH8GYHPCNjPUj5i35GBhgqkeiW1oYJJ4-PtGjH8oytIHwEYgc7oquQs-1ySA5fTTQSTMgttsqfNlwo6k6TFiFlc5xSIujJAt7__LXaBPVao2hRa9qbZ_Xex0h2cAKVvajwuz271mmUmxqpgbqlkrRnRat3iKunvVODC8pkVpS62J4StFxbh7zC1egd76reVHl2zyRmCE5oWHYBHJ2F_WEYgOXlQ9VqPBq1b_KIe3lTQJ1ka81HOaVRq8K7wtrP6YTsXcREsrscTQZHIgvmBJrh5U8U6wR7H55mS15c1SmWTLrDdsRzW7DOpQXK7cZ43PKC2wNepjRxEQh0TkdnioD8JhUmh1pHuMQ5EOq9Mae9mwmnWR6KOL_ZGqGiI1iIjsDHzq-xdBkyTBuqhIDWJOilS02n3cA9zRhVbZFbTvyvWttZoTLODdqQb83wWlNqOMxcgxDpC8nbQjUUoScT9LRIriZLSW-z3gf87KV0nX7Q3YW-L5-BZqgzK-WgFnjLTRj8UKbB4ZWTiS4GSmnU6xN9qF_iFyk1rNdhDNnvJU-W7jokHhCyJunE8pkEW_oKRI0AzY5mY3xRzEk2nczb0xiI6Sr8x0AY29s4HMOhZrt1XpjU1Kn-VJKOoehfSXePTth6hGEf4WCRH46F-cKUrQO2EsneRjRy_H6dDstdtn0G9QmCVas35PwNuTGPZhXuWUy2QatxKMSEfJl3CgdgnN0z3FixOACCB96-fuh8hayFCW2xHJqTHgLCQfOmWHQbaR30LH-X4xV5nUwbpEl7_yPxBR8rvI_vP_kTFfeR_hZYlUS2xuWa6CiMy3_-hSKf2rDcOPeJD80MnZ_mv-lp8GkbCff9ugFLS-zutcELADID5K7tOsqzfi6gWYrh92IhJpoj62VGr61H4XDfo-M99_b5heaKf0nmag4syRiw7Z1SzrvGSXMGTBDp5d_LZCAqePmKBL5jxkMsfngki';

  constructor(private http: HttpClient) {}

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

    // responseType:'text' so we get the raw JSON string back
    return this.http.post(this.UPLOAD_URL, fileBlob, {
      headers,
      responseType: 'text',
    });
  }

  downloadFile(path: string): Observable<string> {
    const downloadUrl = 'https://content.dropboxapi.com/2/files/download';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    });

    return this.http.post(downloadUrl, null, {
      headers,
      responseType: 'text', // Get the raw file content as text
    });
  }
}
