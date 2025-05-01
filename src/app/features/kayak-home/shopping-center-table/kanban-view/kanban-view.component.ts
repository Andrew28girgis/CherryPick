import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { StateService } from 'src/app/core/services/state.service';
import { SocialServiceService } from 'src/app/core/services/social-service.service';
import { Center } from 'src/app/shared/models/shoppingCenters';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrl: './kanban-view.component.css',
})
export class KanbanViewComponent implements OnInit {
  BuyBoxId!: any;

  // shoppingCenters: Center[] = [];
  kanbanId!: number;
  CampaignId: any;

  constructor(
    private viewManagerService: SocialServiceService,
    private activatedRoute: ActivatedRoute,
    private stateService: StateService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.CampaignId = params.campaignId;

      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });
    this.initializeData();
  }

  async initializeData() {
    try {
      this.spinner.show();

      const shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.CampaignId
      );
      this.stateService.setShoppingCenters(shoppingCenters);
      // Get kanban stages using the first kanban ID from the first shopping center
      if (shoppingCenters && shoppingCenters.length > 0) {
        this.kanbanId = shoppingCenters[0].kanbanId;
        console.log(this.kanbanId);
        
      }
    } catch (error) {
      // Handle error
    } finally {
      this.spinner.hide();
      this.cdr.detectChanges();
    }
  }
}

