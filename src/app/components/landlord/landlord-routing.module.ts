import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandlordComponent } from './landlord.component';

const routes: Routes = [{ path: '', component: LandlordComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandlordRoutingModule { }
