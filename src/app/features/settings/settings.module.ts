import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { LinkAccountsComponent } from './components/link-accounts/link-accounts.component';
import { EmailStagesComponent } from './components/email-stages/email-stages.component';
import { EmailStatisticsComponent } from './components/email-statistics/email-statistics.component';

@NgModule({
  declarations: [SettingsComponent, LinkAccountsComponent,  EmailStagesComponent, EmailStatisticsComponent],
  imports: [CommonModule, SettingsRoutingModule],
})
export class SettingsModule {}
