import { Component, OnInit } from '@angular/core';
import { SettingsService } from 'src/app/core/services/settings.service';
import { EmailStage } from './models/email-stage';
import { PlacesService } from 'src/app/core/services/places.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private guid!: string;

  protected displayStages: boolean = false;
  protected displayStats: boolean = false;
  protected emailStages: EmailStage[] = [];
  protected realEstateMailsCount: number = 0;

  constructor(
    private settingsService: SettingsService,
    private readonly placesService: PlacesService
  ) {}

  ngOnInit(): void {
    const guid = localStorage.getItem('guid');
    if (guid) this.guid = guid;
    // this.getStageIdAndName().then(() => {
    //   this.checkOwnerData();
    // });
  }

  private async checkOwnerData(): Promise<void> {
    if (!this.guid) return;

    const contactRequestBody = {
      Name: 'GetContactDataFromGUID',
      Params: {
        GUIDSignature: this.guid.trim(),
      },
    };

    this.placesService
      .BetaGenericAPI(contactRequestBody)
      .subscribe((response: any) => {
        if (response.json && response.json.length) {
          const googleAccessToken = response.json[0].googleAccessToken;
          if (googleAccessToken) {
            this.displayStages = true;
          }
        }
      });
  }

  private async getStageIdAndName(): Promise<void> {
    try {
      this.emailStages = await firstValueFrom(
        this.settingsService.getStageIdAndName()
      );
    } catch (error) {
    }
  }

  protected onMailsReady(count: number): void {
    this.displayStats = true;
    this.realEstateMailsCount = count;
  }

  protected onAccountUnlinked(bool: boolean): void {
    this.displayStages = false;
    this.displayStats = false;
  }
}
