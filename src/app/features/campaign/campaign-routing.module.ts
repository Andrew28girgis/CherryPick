import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampaignManagerComponent } from './campaign-manager/campaign-manager.component';

const routes: Routes = [
  { path: '', component: CampaignManagerComponent },
  {
    path: 'ataglance',
    loadChildren: () =>
      import('./ataglance/ataglance.module').then((m) => m.AtaglanceModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignRoutingModule {}
