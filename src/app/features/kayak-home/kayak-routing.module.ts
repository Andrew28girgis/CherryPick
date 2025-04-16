import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KayakHomeComponent } from './kayak-home.component';
import { BuyboxDetailsComponent } from './buybox-details/buybox-details.component'; 
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component'; 
import { EmilyComponent } from '../emily/emily/emily.component';

const routes: Routes = [
  { path: '', component: KayakHomeComponent },
  { path: 'details', component: BuyboxDetailsComponent },
  {
    path: 'emily/:buyboxId/:orgId/:CenterId/:microDealId',
    component: EmilyComponent,
  },
  { path: 'emily/:buyboxId/:orgId/:microDealId', component: EmilyComponent }, 
  { path: 'shopping-table', component: ShoppingCenterTableComponent },
  { path: 'relations', component: BuyboxRelatiosComponent }, 
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KayakRoutingModule {}
