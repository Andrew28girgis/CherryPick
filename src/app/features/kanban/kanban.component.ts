import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { IUserKanban } from 'src/app/shared/models/iuser-kanban';
import {
  IKanbanDetails,
  KanbanStage,
  KanbanDragingData,
  Action,
  StageOrganization,
  StageListing,
} from 'src/app/shared/models/ikanban-details';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import { popupActions } from './kanban-actions/kanban-actions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { sharedColors } from '../../shared/others/shared-colors';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent implements OnInit, OnDestroy {
  private allUserKanbans: IUserKanban[] = [];
  private kanbanDetails?: IKanbanDetails;
  private pollingInterval: number = 0;

  stagesColors: { background: string; color: string }[] = sharedColors;
  selectedKanbanTabId: number = 1;
  selectedKanbanId?: number;
  breadcrumbList: { kanbanId: number; name: string }[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private location: Location,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getUserKanbans();

    const fetchingKanbanDetailsInterval = setInterval(() => {
      if (this.allUserKanbans && this.allUserKanbans.length > 0) {
        clearInterval(fetchingKanbanDetailsInterval);
        const kanban = this.allUserKanbans.find(
          (kanban) => kanban.targetStakeholderId == 2
        );
        if (kanban) {
          this.breadcrumbList.push({
            kanbanId: kanban.Id,
            name: kanban.kanbanName,
          });

          this.getKanban(kanban.Id);
        }
      }
    }, 100);

    this.pollingInterval = setInterval(() => {
      if (this.selectedKanbanId) {
        this.getKanbanDetails();
      }
    }, 5000);
  }

  private getUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && data.json.length > 0) {
          this.allUserKanbans = data.json;
        } else {
          this.allUserKanbans = [];
        }
      },
    });
  }

  private checkForKanbanChanges(kanbanDetails: IKanbanDetails): boolean {
    let changeFlage: boolean = false;

    const stagesChanged =
      this.activeKanbanDetails?.kanbanStages.length ==
      kanbanDetails.kanbanStages.length;

    if (stagesChanged) {
      kanbanDetails.kanbanStages.forEach((stage) => {
        this.activeKanbanDetails.kanbanStages.forEach((activeKanbanStage) => {
          if (
            stage.StageId == activeKanbanStage.StageId &&
            (stage.StageOrganizations?.length !=
              activeKanbanStage.StageOrganizations?.length ||
              stage.StageListings?.length !=
                activeKanbanStage.StageListings?.length)
          ) {
            changeFlage = true;
          }
        });
      });
    } else {
      changeFlage = true;
    }

    if (changeFlage) {
      this.activeKanbanDetails = { ...kanbanDetails };
    }
    return changeFlage;
  }

  private isDeepEmpty(value: any): boolean {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return true;
      }
      return keys.every((key) => this.isDeepEmpty(value[key]));
    }
    return value === null || value === undefined;
  }

  private transformEmptyArrays(data: any): any {
    if (Array.isArray(data)) {
      const transformed = data.map((item) => this.transformEmptyArrays(item));
      if (transformed.length === 1 && this.isDeepEmpty(transformed[0])) {
        return [];
      }
      return transformed;
    } else if (data && typeof data === 'object') {
      const newData: any = {};
      Object.keys(data).forEach((key) => {
        newData[key] = this.transformEmptyArrays(data[key]);
      });
      return newData;
    }
    return data;
  }

  private getKanbanDetails() {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: this.selectedKanbanId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && data.json.length > 0) {
          let details: IKanbanDetails = data.json[0];

          let cleanedKanbanDetails: IKanbanDetails =
            this.transformEmptyArrays(details);
          if (data.json[0] && this.activeKanbanDetails) {
            const checkForKanbanChanges =
              this.checkForKanbanChanges(cleanedKanbanDetails);

            return;
          }
          cleanedKanbanDetails.kanbanStages =
            cleanedKanbanDetails.kanbanStages.map((s) => {
              if (details.targetStakeholderId == 4) {
                return s.StageListings ? s : { ...s, StageListings: [] };
              } else {
                return s.StageOrganizations
                  ? s
                  : { ...s, StageOrganizations: [] };
              }
            });

          this.kanbanDetails = cleanedKanbanDetails;
        } else {
          this.kanbanDetails = undefined;
        }
      },
    });
  }

  private moveOrganization(
    dragData: KanbanDragingData,
    sourceStageId: string,
    targetStageId: string
  ) {
    const sourceStageNumId = parseInt(sourceStageId);
    const targetStageNumId = parseInt(targetStageId);

    const sourceStage = this.findStageById(sourceStageNumId);
    const targetStage = this.findStageById(targetStageNumId);

    if (!sourceStage || !targetStage) {
      console.error('Could not find source or target stage');
      return;
    }

    if (dragData.orgIndex === -1) {
      console.error('Could not find organization in source stage');
      return;
    }

    const org = sourceStage.StageOrganizations?.[dragData.orgIndex];
    if (org) {
      const organization: StageOrganization = { ...org };
      sourceStage.StageOrganizations?.splice(dragData.orgIndex, 1);

      if (!targetStage.StageOrganizations) {
        targetStage.StageOrganizations = [];
      }
      targetStage.StageOrganizations?.push(organization);

      this.updateOrganizationStage(targetStageNumId, org.kanbanOrganizationid);
    }
  }

  private moveShoppingCenter(
    dragData: KanbanDragingData,
    sourceStageId: string,
    targetStageId: string
  ) {
    const sourceStageNumId = parseInt(sourceStageId);
    const targetStageNumId = parseInt(targetStageId);

    const sourceStage = this.findStageById(sourceStageNumId);
    const targetStage = this.findStageById(targetStageNumId);

    if (!sourceStage || !targetStage) {
      console.error('Could not find source or target stage');
      return;
    }

    if (dragData.orgIndex === -1) {
      console.error('Could not find organization in source stage');
      return;
    }

    const org = sourceStage.StageListings?.[dragData.orgIndex];
    if (org) {
      const organization: StageListing = { ...org };
      sourceStage.StageListings?.splice(dragData.orgIndex, 1);

      if (!targetStage.StageListings) {
        targetStage.StageListings = [];
      }
      targetStage.StageListings?.push(organization);

      this.updatePropertyStage(
        targetStageNumId,
        org.MarketSurveyShoppingCenterId
      );
    }
  }

  private findStageById(stageId: number): KanbanStage | null {
    if (!this.activeKanbanDetails || !this.activeKanbanDetails.kanbanStages) {
      return null;
    }

    return (
      this.activeKanbanDetails.kanbanStages.find(
        (stage) => stage.StageId === stageId
      ) || null
    );
  }

  private updateOrganizationStage(stageId: number, organizationId: number) {
    this.spinner.show();
    const body: any = {
      name: 'UpdateKanbanOrganizationStage',
      params: {
        StageId: stageId,
        kanbanOrganizationId: organizationId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  private updatePropertyStage(stageId: number, marketSurveyId: number) {
    this.spinner.show();
    const body: any = {
      name: 'UpdatePlaceKanbanStage',
      params: {
        stageid: stageId,
        marketsurveyid: marketSurveyId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  removeBreadcrumbItem(kanbanId: number): void {
    if (this.breadcrumbList.length != 1) {
      const index = this.breadcrumbList.findIndex(
        (b) => b.kanbanId == kanbanId
      );

      if (index >= 0 && this.breadcrumbList.length - 1 != index) {
        this.breadcrumbList = this.breadcrumbList.slice(0, index + 1);
        this.getKanban(kanbanId);
      }
    }
  }

  updateKanbanId(
    kanbanId: number,
    name: string,
    organizationName?: string
  ): void {
    this.breadcrumbList.push({
      kanbanId: kanbanId,
      name: organizationName ? organizationName + ' - ' + name : name,
    });
    this.getKanban(kanbanId);
  }

  getKanban(kanbanId: number) {
    this.kanbanDetails = undefined;

    this.selectedKanbanId = kanbanId;

    this.getKanbanDetails();
  }

  onDrop(event: CdkDragDrop<StageOrganization[] | StageListing[]>) {
    const dragData: KanbanDragingData = event.item.data;
    if (event.previousContainer === event.container) {
    } else {
      if (dragData.type === 'organization') {
        this.moveOrganization(
          dragData,
          event.previousContainer.id,
          event.container.id
        );
      } else if (dragData.type === 'center') {
        this.moveShoppingCenter(
          dragData,
          event.previousContainer.id,
          event.container.id
        );
      }
    }
  }

  get activeKanbansList() {
    if (this.allUserKanbans && this.allUserKanbans.length > 0) {
      return this.allUserKanbans;
    }

    return [];
  }

  get activeKanbanDetails() {
    return this.kanbanDetails!;
  }

  set activeKanbanDetails(value: IKanbanDetails) {
    this.kanbanDetails = value;
  }

  removeIdFromUrl() {
    this.location.replaceState('/Kanban');
  }

  checkForTargetActionsDisplay(actions: Action[]): boolean {
    return actions.some((a) => a.actionLevel == 'Target');
  }

  checkForStageActionsDisplay(actions: Action[]): boolean {
    return actions.some((a) => a.actionLevel == 'Stage');
  }

  openActionPopup(key: string): void {
    const modalComponent = popupActions.get(key);

    if (modalComponent) {
      const modalRef = this.modalService.open(modalComponent, {
        windowClass: 'kanban-action-popup',
        scrollable: true,
        size: 'xl',
      });
    }
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
