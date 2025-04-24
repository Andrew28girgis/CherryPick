import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampaignManagerComponent } from './campaign-manager/campaign-manager.component';
import { AddCampaignComponent } from './add-campaign/add-campaign.component';
import { AddNewCampaignComponent } from './add-new-campaign/add-new-campaign.component';

const routes: Routes = [
  { path: '', component: CampaignManagerComponent },
  { path: 'add-campaign', component: AddCampaignComponent },
  // { path: 'add-campaign', component: AddNewCampaignComponent },
  {
    path: 'ataglance/:id',
    loadChildren: () =>
      import('./ataglance/ataglance.module').then((m) => m.AtaglanceModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignRoutingModule {}
