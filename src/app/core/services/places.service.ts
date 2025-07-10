import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  map,
  Observable,
  retry,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { ChangePassword, Registeration } from 'src/app/shared/models/domain';
import { ResetPassword } from 'src/app/shared/models/domain';
import { ForgotPassword } from 'src/app/shared/models/domain';
import { EncodeService } from './encode.service';
import { DropboxService } from './dropbox.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  appMode!: string ;

  constructor(
    private http: HttpClient,
    private base62: EncodeService,
    private dropbox: DropboxService
  ) { }

  setAppMode(mode: string) {
    this.appMode = mode;  
    console.log(`from ss`);
    console.log(this.appMode);
    
      
  }
  
  getAppMode(): string {
    return this.appMode;
  }
  
  public GetBuyBoxPlaces(buyBoxId: any) {
    return this.http.get<any>(
      `${environment.api}/BuyBox/GetBuyBoxPlaces?buyboxid=${buyBoxId}`
    );
  }

  public GetBrokerCategories() {
    return this.http.get<any>(`${environment.api}/BuyBox/GetBrokerCategories`);
  }

  public GetAllBuyBoxComparables(buyBoxId: number) {
    return this.http.get<any>(
      `${environment.api}/BuyBox/GetAllBuyBoxComparables?buyBoxId=${buyBoxId}`
    );
  }

  public userToken(email: string) {
    return this.http.get(
      `${environment.api}/DropBox/GetUserTokens?Email=${email}`
    );
  }

  public BetaGenericAPI(body: any): Observable<any> {
    let encoded: string | undefined;
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(body));
    encoded = this.base62.encode(utf8Bytes);
    let dropboxPath = `/cache/${encoded}.json`;

    if (this.appMode === 'api') {
      return this.http.post<any>(
        `${environment.API_URL}/GenericAPI/Execute`,
        body
      );
    } else {
      let hasUploaded = false;
      const tryDownload = (): Observable<any> => {
        return this.dropbox.downloadFile(dropboxPath!).pipe(
          map((fileContent: string) => {
            try {
              const convertedBytes = JSON.parse(fileContent);
              console.log('Converted Bytes:', convertedBytes);

              // Check if we got a meaningful result (not empty)
              if (convertedBytes && Object.keys(convertedBytes).length > 0) {
                return convertedBytes;
              } else {
                // If empty result, continue polling
                throw new Error('Empty result, continue polling');
              }
            } catch (err) {
              console.error(
                'Error parsing JSON from Dropbox file content:',
                err
              );
              throw err;
            }
          }),
          catchError((error: any) => {
            if (
              (error.status === 409 || error.status === 404) &&
              !hasUploaded &&
              encoded
            ) {
              hasUploaded = true;
              const emptyJsonBlob = new Blob(['{}'], {
                type: 'application/json',
              });
              const newPath = `/new/${encoded}.json`;

              return this.dropbox.uploadFile(emptyJsonBlob, newPath).pipe(
                tap((res) => console.log('Dropbox upload succeeded:', res)),
                switchMap(() => {
                  return this.pollForResult(tryDownload);
                })
              );
            }

            if (hasUploaded) {
              return this.pollForResult(tryDownload);
            }

            return throwError(error);
          })
        );
      };

      return tryDownload();
    }
  }

  public GenericAPI(body: any): Observable<any> {
    let encoded: string | undefined;
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(body));
    encoded = this.base62.encode(utf8Bytes);
    let dropboxPath = `/cache/${encoded}.json`;

    if (this.appMode === 'api') {
      return this.http.post<any>(`${environment.api}/GenericAPI/Execute`, body);
    } else {
      let hasUploaded = false;
      const tryDownload = (): Observable<any> => {
        return this.dropbox.downloadFile(dropboxPath!).pipe(
          map((fileContent: string) => {
            try {
              const convertedBytes = JSON.parse(fileContent);
              console.log('Converted Bytes:', convertedBytes);

              // Check if we got a meaningful result (not empty)
              if (convertedBytes && Object.keys(convertedBytes).length > 0) {
                return convertedBytes;
              } else {
                // If empty result, continue polling
                throw new Error('Empty result, continue polling');
              }
            } catch (err) {
              console.error(
                'Error parsing JSON from Dropbox file content:',
                err
              );
              throw err;
            }
          }),
          catchError((error: any) => {
            if (
              (error.status === 409 || error.status === 404) &&
              !hasUploaded &&
              encoded
            ) {
              hasUploaded = true;
              const emptyJsonBlob = new Blob(['{}'], {
                type: 'application/json',
              });
              const newPath = `/new/${encoded}.json`;

              return this.dropbox.uploadFile(emptyJsonBlob, newPath).pipe(
                tap((res) => console.log('Dropbox upload succeeded:', res)),
                switchMap(() => {
                  return this.pollForResult(tryDownload);
                })
              );
            }

            if (hasUploaded) {
              return this.pollForResult(tryDownload);
            }

            return throwError(error);
          })
        );
      };

      return tryDownload();
    }
  }

  private pollForResult(downloadFn: () => Observable<any>): Observable<any> {
    return timer(2000).pipe(
      switchMap(() => downloadFn()),
      retry({ delay: 2000 })
    );
  }

  public newLoginUser(message: any): Observable<any> {
    if (this.appMode === 'api') {
      return this.http.post<any[]>(
        `${environment.API_URL}/BuyBox/Login`,
        message
      );
    }

    let encoded: string | undefined;
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(message));
    encoded = this.base62.encode(utf8Bytes);
    let dropboxPath = `/loginResponse/${encoded}.json`;

    if (this.appMode === 'api') {
      return this.http.post<any>(
        `${environment.api}/GenericAPI/Execute`,
        message
      );
    } else {
      let hasUploaded = false;
      const tryDownload = (): Observable<any> => {
        return this.dropbox.downloadFile(dropboxPath!).pipe(
          map((fileContent: string) => {
            try {
              const convertedBytes = JSON.parse(fileContent);
              console.log('Converted Bytes:', convertedBytes);

              if (convertedBytes && Object.keys(convertedBytes).length > 0) {
                return convertedBytes;
              } else {
                throw new Error('Empty result, continue polling');
              }
            } catch (err) {
              console.error(
                'Error parsing JSON from Dropbox file content:',
                err
              );
              throw err;
            }
          }),
          tap((data) => {
            // Fire-and-forget delete
            this.dropbox.deleteFile(dropboxPath!).subscribe({
              next: () => console.log('Dropbox file deleted:', dropboxPath),
              error: (err) => console.error('Dropbox file delete error:', err),
            });
          }),
          catchError((error: any) => {
            if (
              (error.status === 409 || error.status === 404) &&
              !hasUploaded &&
              encoded
            ) {
              hasUploaded = true;
              const emptyJsonBlob = new Blob(['{}'], {
                type: 'application/json',
              });
              const newPath = `/login/${encoded}.json`;

              return this.dropbox.uploadFile(emptyJsonBlob, newPath).pipe(
                tap((res) => console.log('Dropbox upload succeeded:', res)),
                switchMap(() => this.pollForResult(tryDownload))
              );
            }

            if (hasUploaded) {
              return this.pollForResult(tryDownload);
            }

            return throwError(error);
          })
        );
      };

      return tryDownload();
    }
  }

  public GenericAPILocal(body: any) {
    return this.http.post<any>(
      `http://10.0.0.15:8082/api/GenericAPI/Execute`,
      body
    );
  }

  public loginUser(message: any) {
    return this.http.post<any[]>(`${environment.api}/BuyBox/Login`, message);
  }

  ChangePassword(request: ChangePassword) {
    return this.http.post<boolean>(
      `${environment.api}/BuyBox/ChangePassword`,
      request
    );
  }
  ResetPassword(request: ResetPassword) {
    return this.http.post<boolean>(
      `${environment.api}/BuyBox/ResetPassword`,
      request
    );
  }
  ForgotPassword(request: ForgotPassword) {
    return this.http.post<boolean>(
      `${environment.api}/BuyBox/ForgotPassword`,
      request
    );
  }

  public UpdateBuyBoxWorkSpacePlace(message: any) {
    return this.http.post<any>(
      `${environment.api}/BuyBox/UpdatePlaceNote`,
      message
    );
  }

  GetUserBuyBoxes(): Observable<any> {
    return this.http.get<any>(`${environment.api}/BuyBox/GetUserBuyBoxes`);
  }
  public GenericAPIHtml(body: any): Observable<any> {
    return this.http.post(`${environment.api}/GenericAPI/Execute`, body);
  }
  public generateEmail(
    promptId: number,
    context: string,
    OrganizaitonsId: any,
    IsCC: boolean
  ) {
    const apiUrl = `${environment.api}/PromptHub/GenerateEmail`;
    const body = {
      promptId,
      context,
      IsCC,
      OrganizaitonsId,
    };
    return this.http.post<any>(apiUrl, body);
  }

  public GenerateContext(body: GenerateContextDTO) {
    const apiUrl = `${environment.api}/PromptHub/GenerateContext`;
    return this.http.post<any>(apiUrl, body);
  }

  public GetSiteCurrentStatus(
    shoppingCenterId: number,
    CampaignId: number
  ): Observable<string> {
    const apiUrl = `${environment.api}/PromptHub/GetSiteCurrentStatus/${shoppingCenterId}/${CampaignId}`;
    return this.http.get(apiUrl, { responseType: 'text' });
  }

  public UploadFile(formData: FormData, id: number) {
    return this.http.post<any>(
      `${environment.api}/HelperUpload/UploadFile//Enrich/${id}`,
      formData
    );
  }
  public SendImagesArray(images: any, shoppingID: any) {
    return this.http.post<any>(
      `${environment.api}/BrokerWithChatGPT/ProcessImagesWithGPT/${shoppingID}`,
      images
    );
  }
  public SendImagesArrayWithBuyBoxId(
    images: any,
    shoppingID: any,
    buyboxid: any
  ) {
    return this.http.post<any>(
      `${environment.api}/BrokerWithChatGPT/ProcessImagesWithGPT/${shoppingID}?buyboxId=${buyboxid}`,
      images
    );
  }

  public SendJsonData(data: any, id: any) {
    const requestPayload = {
      ...data, // Spread the existing data
      // shoppingcenterid: id,
    };

    return this.http.post<any>(
      `${environment.api}/BrokerWithChatGPT/UpdateAvailability/${id}`,
      requestPayload
    );
  }

  public autoLoginWithGuid(guid: string) {
    const url = environment.API_URL + `/BuyBox/LoginWithGuid/${guid}`;
    return this.http.post(url, {});
  }
}
