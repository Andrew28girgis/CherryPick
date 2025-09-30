import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
  import { ViewManagerService } from 'src/app/core/services/view-manager.service';

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
    private viewManagerService: ViewManagerService,
    private activatedRoute: ActivatedRoute,
     private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.CampaignId = params.campaignId;

      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });
    //this.initializeData();
  }

  async initializeData() {
    try {
      this.spinner.show();

      const shoppingCenters = await this.viewManagerService.loadShoppingCenters(
        this.CampaignId
      );
       // Get kanban stages using the first kanban ID from the first shopping center
      // if (shoppingCenters && shoppingCenters.length > 0) {
      //   this.kanbanId = shoppingCenters[0].kanbanId;
        
      // }
    } catch (error) {
      // Handle error
    } finally {
      this.spinner.hide();
      this.cdr.detectChanges();
    }
  }
}

