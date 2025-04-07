import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AtaglanceComponent } from './ataglance.component';

const routes: Routes = [{ path: '', component: AtaglanceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AtaglanceRoutingModule {}
