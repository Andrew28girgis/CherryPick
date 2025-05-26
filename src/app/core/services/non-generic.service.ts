import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class NonGenericService {
  constructor(private http: HttpClient) {}

  public getPartitions(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.api}/Directory/partitions`);
  }

  public getChildren(parentPath: string): Observable<any> {
    return this.http.get<any>(
      `${environment.api}/Directory/children?parentPath=${encodeURIComponent(
        parentPath
      )}`
    );
  }
}
