import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/shared/services/places.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { IUserKanban } from 'src/app/shared/models/iuser-kanban';
import {
  IKanbanDetails,
  Organization,
  KanbanOrganization,
  ShoppingCenter,
  KanbanStage,
  KanbanDragingData,
  Action,
} from 'src/app/shared/models/ikanban-details';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import { popupActions } from './kanban-actions/kanban-actions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { sharedColors } from '../../shared/others/shared-colors';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent implements OnInit, OnDestroy {
  private allUserKanbans: IUserKanban[] = [];
  private userTenantsKanbans: IUserKanban[] = [];
  private userTenantsKanbansDetails?: IKanbanDetails;
  private userBuyBoxesKanbans: IUserKanban[] = [];
  private userBuyBoxesKanbansDetails?: IKanbanDetails;
  private userBuyBoxesPropertiesKanbans: IUserKanban[] = [];
  private userBuyBoxesPropertiesKanbansDetails?: IKanbanDetails;
  private pollingInterval: number = 0;
  stagesColors: { background: string; color: string }[] = sharedColors;

  kanbanTabs: { id: number; title: string }[] = [
    { id: 1, title: 'Tenants' },
    { id: 2, title: 'Organizations' },
    { id: 3, title: 'Properties' },
  ];
  selectedKanbanTabId: number = 1;
  selectedKanban?: IUserKanban;

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

    this.activatedRoute.paramMap.subscribe((parms) => {
      const id = parms.get('id');

      if (id) {
        const fetchingKanbanDetailsInterval = setInterval(() => {
          if (this.allUserKanbans && this.allUserKanbans.length > 0) {
            clearInterval(fetchingKanbanDetailsInterval);

            this.userTenantsKanbans.find((k) => k.Id == +id)
              ? (this.selectedKanbanTabId = 1)
              : this.userBuyBoxesKanbans.find((k) => k.Id == +id)
              ? (this.selectedKanbanTabId = 2)
              : (this.selectedKanbanTabId = 3);

            const kanban = this.allUserKanbans.find((k) => k.Id == +id);
            if (kanban) {
              this.getKanban(kanban);
            }
          }
        }, 100);
      } else {
        const fetchingKanbanDetailsInterval = setInterval(() => {
          if (this.allUserKanbans && this.allUserKanbans.length > 0) {
            clearInterval(fetchingKanbanDetailsInterval);
            const kanban = this.userTenantsKanbans[0];
            if (kanban) {
              this.getKanban(kanban);
            }
          }
        }, 100);
      }
    });

    this.pollingInterval = setInterval(() => {
      if (this.selectedKanban) {
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
          this.splitAllUserKanbans();
        } else {
          this.allUserKanbans = [];
        }
      },
    });
  }

  private splitAllUserKanbans(): void {
    this.setupUserTenantsKanbans();
    this.setupUserBuyBoxesKanbans();
    this.setupUserBuyBoxesPropertiesKanbans();
  }

  private setupUserTenantsKanbans(): void {
    this.userTenantsKanbans = this.allUserKanbans.filter(
      (k) => k.targetStakeholderId == 2
    );

    this.sortKanbans(this.userTenantsKanbans);
  }

  private setupUserBuyBoxesKanbans(): void {
    this.userBuyBoxesKanbans = this.allUserKanbans.filter(
      (k) => k.targetStakeholderId != 2 && k.targetStakeholderId != 4
    );
    this.sortKanbans(this.userBuyBoxesKanbans);
  }

  private setupUserBuyBoxesPropertiesKanbans(): void {
    this.userBuyBoxesPropertiesKanbans = this.allUserKanbans.filter(
      (k) => k.targetStakeholderId == 4
    );
    this.sortKanbans(this.userBuyBoxesPropertiesKanbans);
  }

  private sortKanbans(kanbans: IUserKanban[]): void {
    kanbans.sort((a, b) => {
      if (a.kanbanTemplateId === b.kanbanTemplateId) {
        return a.kanbanName.localeCompare(b.kanbanName);
      }
      return a.kanbanTemplateId - b.kanbanTemplateId;
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
            stage.Id == activeKanbanStage.Id &&
            stage.kanbanOrganizations.length !=
              activeKanbanStage.kanbanOrganizations.length
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
        kanbanId: this.selectedKanban?.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && data.json.length > 0) {
          const cleanedKanbanDetails = this.transformEmptyArrays(data.json[0]);
          if (data.json[0] && this.activeKanbanDetails) {
            const checkForKanbanChanges =
              this.checkForKanbanChanges(cleanedKanbanDetails);
            console.log(checkForKanbanChanges);

            return;
          }

          switch (this.selectedKanban?.targetStakeholderId) {
            case 2: {
              this.userTenantsKanbansDetails = cleanedKanbanDetails;
              if (this.userTenantsKanbansDetails) {
                this.sortKanbanDetailsOrganizations(
                  this.userTenantsKanbansDetails
                );
              }
              break;
            }
            case 4: {
              this.userBuyBoxesPropertiesKanbansDetails = cleanedKanbanDetails;
              if (this.userBuyBoxesPropertiesKanbansDetails) {
                this.sortKanbanDetailsCenters(
                  this.userBuyBoxesPropertiesKanbansDetails
                );
              }
              break;
            }
            default: {
              this.userBuyBoxesKanbansDetails = cleanedKanbanDetails;
              if (this.userBuyBoxesKanbansDetails) {
                this.sortKanbanDetailsOrganizations(
                  this.userBuyBoxesKanbansDetails
                );
              }
            }
          }
        } else {
          this.userTenantsKanbansDetails = undefined;
          this.userBuyBoxesKanbansDetails = undefined;
          this.userBuyBoxesPropertiesKanbansDetails = undefined;
        }
      },
    });
  }

  private sortKanbanDetailsOrganizations(kanbanDetails: IKanbanDetails): void {
    kanbanDetails.kanbanStages.forEach((stage) => {
      stage.kanbanOrganizations.forEach((kanbanOrg) => {
        if (kanbanOrg.Organization) {
          kanbanOrg.Organization.sort((a, b) => {
            const nameA = a.OrganizationName
              ? a.OrganizationName.toLowerCase()
              : '';
            const nameB = b.OrganizationName
              ? b.OrganizationName.toLowerCase()
              : '';
            return nameA.localeCompare(nameB);
          });
        }
      });
    });
  }

  private sortKanbanDetailsCenters(kanbanDetails: IKanbanDetails): void {
    kanbanDetails.kanbanStages.forEach((stage) => {
      stage.kanbanOrganizations.forEach((kanbanOrg) => {
        if (kanbanOrg.Organization) {
          kanbanOrg.Organization.forEach((org) => {
            if (org.ShoppingCenters) {
              org.ShoppingCenters.sort((a, b) => {
                const centerA = a.CenterName ? a.CenterName.toLowerCase() : '';
                const centerB = b.CenterName ? b.CenterName.toLowerCase() : '';
                return centerA.localeCompare(centerB);
              });
            }
          });
        }
      });
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

    const organization = {
      ...sourceStage.kanbanOrganizations[dragData.orgIndex],
    };

    organization.kanbanStageId = targetStageNumId;

    sourceStage.kanbanOrganizations.splice(dragData.orgIndex, 1);

    targetStage.kanbanOrganizations.push(organization);

    this.updateOrganizationStage(targetStageNumId, organization);
  }

  private findStageById(stageId: number): KanbanStage | null {
    if (!this.activeKanbanDetails || !this.activeKanbanDetails.kanbanStages) {
      return null;
    }

    return (
      this.activeKanbanDetails.kanbanStages.find(
        (stage) => stage.Id === stageId
      ) || null
    );
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

    const sourceOrgContainer =
      sourceStage.kanbanOrganizations[dragData.orgIndex];
    if (!sourceOrgContainer) {
      console.error('Could not find source organization container');
      return;
    }

    const center = dragData.value as ShoppingCenter;

    const newOrg: Organization = {
      ...sourceOrgContainer.Organization[0],
      ShoppingCenters: [center],
    };

    const sourceOrg = sourceOrgContainer.Organization[0];
    sourceOrg.ShoppingCenters.splice(dragData.centerIndex!, 1);

    const newOrgContainer: KanbanOrganization = {
      Organization: [newOrg],
      kanbanStageId: targetStageNumId,
    };

    targetStage.kanbanOrganizations.push(newOrgContainer);

    this.updatePropertyStage(targetStageNumId, center);
  }

  private updateOrganizationStage(
    stageId: number,
    organization: KanbanOrganization
  ) {
    this.spinner.show();
    const body: any = {
      name: 'UpdateKanbanOrganizationStage',
      params: {
        StageId: stageId,
        kanbanOrganizationId: organization.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  private updatePropertyStage(stageId: number, property: ShoppingCenter) {
    this.spinner.show();
    const body: any = {
      name: 'UpdatePlaceKanbanStage',
      params: {
        stageid: stageId,
        marketsurveyid: property.MarketSurveyShoppingCenters[0].MarketSurveyId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  getKanban(kanban: IUserKanban) {
    this.userTenantsKanbansDetails = undefined;
    this.userBuyBoxesKanbansDetails = undefined;
    this.userBuyBoxesPropertiesKanbansDetails = undefined;

    this.selectedKanban = kanban;

    this.getKanbanDetails();
  }

  onKanbanTabSelected(tabId: number): void {
    this.removeIdFromUrl();
    this.selectedKanbanTabId = tabId;
    switch (tabId) {
      case 1: {
        const kanban = this.userTenantsKanbans[0];
        if (kanban) {
          this.getKanban(kanban);
        }
        break;
      }
      case 2: {
        const kanban = this.userBuyBoxesKanbans[0];
        if (kanban) {
          this.getKanban(kanban);
        }
        break;
      }
      case 3: {
        const kanban = this.userBuyBoxesPropertiesKanbans[0];
        if (kanban) {
          this.getKanban(kanban);
        }
        break;
      }
    }
  }

  onDrop(event: CdkDragDrop<KanbanOrganization[]>) {
    const dragData: KanbanDragingData = event.item.data;

    const targetStageId = parseInt(event.container.id.replace('stage-', ''));

    if (event.previousContainer === event.container) {
      console.log('Reordering within the same stage');
    } else {
      console.log(`Moving ${dragData.type} to stage ${targetStageId}`);

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

  get activeTabKanbansList() {
    if (this.selectedKanbanTabId == 2) {
      return this.userBuyBoxesKanbans;
    } else if (this.selectedKanbanTabId == 3) {
      return this.userBuyBoxesPropertiesKanbans;
    }
    return [];
  }

  get activeKanbanDetails() {
    if (this.selectedKanbanTabId == 2) {
      return this.userBuyBoxesKanbansDetails!;
    } else if (this.selectedKanbanTabId == 3) {
      return this.userBuyBoxesPropertiesKanbansDetails!;
    }
    return this.userTenantsKanbansDetails!;
  }

  set activeKanbanDetails(value: IKanbanDetails) {
    if (this.selectedKanbanTabId === 2) {
      this.userBuyBoxesKanbansDetails = value;
    } else if (this.selectedKanbanTabId === 3) {
      this.userBuyBoxesPropertiesKanbansDetails = value;
    } else {
      this.userTenantsKanbansDetails = value;
    }
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
      });
      // modalRef.componentInstance.action = action; // Passing action as input
    }
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
