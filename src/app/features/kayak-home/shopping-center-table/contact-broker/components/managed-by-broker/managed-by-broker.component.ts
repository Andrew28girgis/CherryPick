import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Center,
  ManagerOrganization,
} from 'src/app/shared/models/shoppingCenters';
import { IManagedByBroker } from '../../models/imanaged-by-broker';

interface CenterData {
  id: number;
  centerName: string;
}

@Component({
  selector: 'app-managed-by-broker',
  templateUrl: './managed-by-broker.component.html',
  styleUrl: './managed-by-broker.component.css',
})
export class ManagedByBrokerComponent implements OnChanges {
  protected centers: Map<number, CenterData[]> = new Map<
    number,
    CenterData[]
  >();
  protected SelectedCenters: Map<number, number[]> = new Map<
    number,
    number[]
  >();

  @Input() center!: Center;
  @Output() onStepDone = new EventEmitter<IManagedByBroker[]>();

  constructor(
    private placeService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (
      this.center &&
      this.center.CampaignId &&
      this.center.ShoppingCenter.ManagerOrganization &&
      this.center.ShoppingCenter.ManagerOrganization.length > 0
    ) {
      this.spinner.show();
      for (let contact of this.center.ShoppingCenter.ManagerOrganization) {
        const data = await this.getCentersForContactId(
          contact.ContactId,
          this.center.CampaignId
        );
        this.centers.set(contact.ContactId, data);
      }
      this.spinner.hide();
    }
  }

  async getCentersForContactId(
    contactId: number,
    campaignId: number
  ): Promise<CenterData[]> {
    const body = {
      Name: 'GetShoppingCentersForContact',
      Params: {
        ContactId: contactId,
        CampaignId: campaignId,
      },
    };

    const response = await firstValueFrom(this.placeService.GenericAPI(body));
    if (response.json && response.json.length > 0) {
      return response.json;
    }
    return [];
  }

  getCentersWithContactId(contactId: number): CenterData[] {
    if (this.centers.has(contactId))
      return this.centers.get(contactId)!.filter((c) => c.id != this.center.Id);
    return [];
  }

  onCenterChecked(event: any, contactId: number, centerId: number): void {
    const checked = event.target.checked;
    if (checked) {
      const exist = this.SelectedCenters.has(contactId);
      if (!exist) {
        this.SelectedCenters.set(contactId, [centerId]);
      } else {
        let centers = this.SelectedCenters.get(contactId);
        if (centers) {
          centers = [...centers, centerId];
        }
      }
    } else {
      const exist = this.SelectedCenters.has(contactId);
      if (exist) {
        const centers = this.SelectedCenters.get(contactId);
        if (centers?.includes(centerId)) {
          centers.splice(centers.indexOf(centerId), 1);
        }
      }
    }
  }

  onSkip(): void {
    this.onStepDone.emit([]);
  }

  onSubmit(): void {
    let array: IManagedByBroker[] = [];
    this.SelectedCenters.forEach((value, key) => {
      array.push({ contactId: key, centers: value });
    });
    this.onStepDone.emit(array);
  }
}
