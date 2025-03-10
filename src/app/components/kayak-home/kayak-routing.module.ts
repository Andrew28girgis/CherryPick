import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KayakHomeComponent } from './kayak-home.component';
import { BuyboxDetailsComponent } from './buybox-details/buybox-details.component';
import { WorkSpacesComponent } from './work-spaces/work-spaces.component';
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component';
import { KayakComponent } from './kayak/kayak.component';
import { EmilyComponent } from './emily/emily.component';
import { MyInboxEmailListComponent } from './my-inbox-email-list/my-inbox-email-list.component';
import { EmilyContactEmailComponent } from './emily-stages/emily-contact-email/emily-contact-email.component';

const routes: Routes = [
  { path: '', component: KayakHomeComponent },
  { path: 'details', component: BuyboxDetailsComponent },
  { path: 'emily/:buyboxId/:orgId/:CenterId/:microDealId', component: EmilyComponent },
  { path: 'emily/:buyboxId/:orgId/:microDealId', component: EmilyComponent },
  { path: 'work-spaces', component: WorkSpacesComponent },
  { path: 'shopping-table', component: ShoppingCenterTableComponent },
  { path: 'relations', component: BuyboxRelatiosComponent },
  { path: 'kayak', component: KayakComponent },
  { path: 'MyInboxs', component: MyInboxEmailListComponent }, 
  { path: 'organization-mail/:orgId/:contactId', component: EmilyContactEmailComponent },
  // {
  //   path: 'emily/:buyBoxId',
  //   component: EmilyOrgComponent, // Parent component
  //   children: [
  //     {
  //       path: 'contact-email/:orgId/:emailId',
  //       component: EmilyContactEmailComponent,
  //       outlet: 'contactEmailOutlet' // Named router outlet
  //     }
  //   ]
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class KayakRoutingModule {}