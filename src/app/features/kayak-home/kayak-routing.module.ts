import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShoppingCenterTableComponent } from './shopping-center-table/shopping-center-table.component';
 
const routes: Routes = [
  { path: '', component: ShoppingCenterTableComponent }, 
  { path: 'shopping-table', component: ShoppingCenterTableComponent },
 ];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KayakRoutingModule {}
