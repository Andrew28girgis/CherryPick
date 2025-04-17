import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KayakHomeComponent } from './kayak-home.component'; 
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
import { BuyboxRelatiosComponent } from './buybox-relatios/buybox-relatios.component';

const routes: Routes = [
  { path: '', component: KayakHomeComponent }, 
  { path: 'shopping-table', component: ShoppingCenterTableComponent },
  { path: 'relations', component: BuyboxRelatiosComponent },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KayakRoutingModule {}
