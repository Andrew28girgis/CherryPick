import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandlordComponent } from './landlord.component';
import { ManagePropertiesComponent } from './manage-properties/manage-properties.component';

const routes: Routes = [
  { path: '', component: ManagePropertiesComponent },
  { path: 'manage-properties', component: ManagePropertiesComponent },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandlordRoutingModule { }
