import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KayakHomeComponent } from './kayak-home.component';
import { BuyboxDetailsComponent } from './buybox-details/buybox-details.component';
import { WorkSpacesComponent } from './work-spaces/work-spaces.component';
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component';
import { KayakComponent } from './kayak/kayak.component';
import { EmilyComponent } from './emily/emily.component';
import { EmilyOrgComponent } from './emily-org/emily-org.component';

const routes: Routes = [
  { path: '', component: KayakHomeComponent },
  { path: 'details', component: BuyboxDetailsComponent },
  { path: 'emily/:buyboxId/:orgId/:CenterId', component: EmilyComponent },
  { path: 'emily-org/:buyboxId/:orgId', component: EmilyOrgComponent },
  { path: 'work-spaces', component: WorkSpacesComponent },
  { path: 'shopping-table', component: ShoppingCenterTableComponent },
  { path: 'relations', component: BuyboxRelatiosComponent },
  { path: 'kayak', component: KayakComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class KayakRoutingModule {}
