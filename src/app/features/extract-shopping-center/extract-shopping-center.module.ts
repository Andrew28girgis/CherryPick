import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtractShoppingCenterComponent } from './extract-shopping-center.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  { path: '', component: ExtractShoppingCenterComponent }
];

@NgModule({
  declarations: [
    ExtractShoppingCenterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgbCarouselModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ExtractShoppingCenterModule { }