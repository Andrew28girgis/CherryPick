import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { ChangePassword, Registeration } from 'src/app/shared/models/domain';
import { ResetPassword } from 'src/app/shared/models/domain';
import { ForgotPassword } from 'src/app/shared/models/domain';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  constructor(private http: HttpClient) {}

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

  public GenericAPI(body: any) {
    return this.http.post<any>(`${environment.api}/GenericAPI/Execute`, body);
  }
  // for testing local generic api
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
    return this.http.post<boolean>(`${environment.api}/BuyBox/ChangePassword`, request);
  }
  ResetPassword(request: ResetPassword) {
    return this.http.post<boolean>(`${environment.api}/BuyBox/ResetPassword`, request);
  }
  ForgotPassword(request: ForgotPassword) {
    return this.http.post<boolean>(`${environment.api}/BuyBox/ForgotPassword`, request);
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
    return this.http.post(
      `${environment.api}/GenericAPI/Execute`,
      body,

    );
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
}
