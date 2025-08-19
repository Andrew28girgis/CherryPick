import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarketSurveyComponent } from './market-survey-home/market-survey.component';
import { MarketTableViewComponent } from './market-table-view/market-table-view.component';
import { SocialMediaViewComponent } from './market-social-view/social-media-view.component';
import { MarketSideViewComponent } from './market-side-view/market-side-view.component';
import { MarketMapViewComponent } from './market-map-view/market-map-view.component';
import { MarketCardViewComponent } from './market-card-view/market-card-view.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgbTooltipModule, NgbCarouselModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  { path: '', component: MarketSurveyComponent }
];

@NgModule({
  declarations: [
    MarketSurveyComponent,
    MarketTableViewComponent,
    SocialMediaViewComponent,
    MarketSideViewComponent,
    MarketMapViewComponent,
    MarketCardViewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgbTooltipModule,
    NgbCarouselModule,
    NgbPopoverModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class MarketSurveyModule { }