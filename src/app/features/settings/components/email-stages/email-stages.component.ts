import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmailStage } from '../../models/email-stage';
import { SettingsService } from 'src/app/core/services/settings.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-email-stages',
  templateUrl: './email-stages.component.html',
  styleUrl: './email-stages.component.css',
})
export class EmailStagesComponent implements OnInit {
  private guid!: string;

  protected stagesList: EmailStage[] = [];

  @Input() emailStages!: EmailStage[];
  @Output() realEstateEmailsCount = new EventEmitter<number>();

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    const guid = localStorage.getItem('guid');
    if (guid) this.guid = guid;

    this.startProcess();
  }

  private async startProcess(): Promise<void> {
    if (!this.guid) return;

    for (let stage of this.emailStages) {
      this.stagesList = [
        { id: stage.id, stageMessage: stage.stageMessage, inProgress: true },
        ...this.stagesList,
      ];
      const count = await this.getReadMailsStages(stage.id);
      if (typeof count === 'number') {
        this.stagesList[0].inProgress = false;
        this.stagesList[0].mailsCount = count;
      }
    }
    this.removeDuplication();
  }

  private async getReadMailsStages(stageId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.settingsService.getReadMailsStages(stageId, this.guid)
      );
      return response.totalMailCount;
    } catch (error) {
    }
  }

  private removeDuplication(): void {
    this.stagesList = [
      {
        id: this.stagesList[0].id + 2,
        stageMessage: 'Normalize all emails',
        inProgress: true,
      },
      ...this.stagesList,
    ];

    this.settingsService.removeDuplication().subscribe({
      next: (response) => {
        this.stagesList[0].inProgress = false;
        this.stagesList[0].mailsCount = response.countOfMails;
        this.realEstateEmailsCount.emit(response.countOfMails);
      }
    });
  }
}
