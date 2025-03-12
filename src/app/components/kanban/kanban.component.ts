import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/shared/services/places.service';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Kanban } from 'src/app/shared/models/userKanban';
import {
  KanbanCard,
  KanbanOrganization,
  KanbanStage,
} from 'src/app/shared/models/kanbans';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent implements OnInit, OnDestroy {
  private lastKnownStageCount: number = 0;
  private pollingUpdatesSubscription?: Subscription;
  private isPollingActive: boolean = false;
  private selectedKanban?: Kanban;
  userKanbans: Kanban[] = [];
  activeKanbanId: number | null = null;
  kanbanList: KanbanCard[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private crf: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.GetUserKanbans();

    this.activatedRoute.paramMap.subscribe((parms) => {
      const id = parms.get('id');

      if (id) {
        const fetchingKanbanDetailsInterval = setInterval(() => {
          if (this.userKanbans && this.userKanbans.length > 0) {
            clearInterval(fetchingKanbanDetailsInterval);
            this.GetKanbanDetailsWithId(+id);
          }
        }, 100);
      }
    });
  }

  private fetchKanbanDetails() {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: this.selectedKanban?.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && data.json.length > 0) {
          this.kanbanList = [
            ...data.json.map((kanban: KanbanCard) => ({
              ...kanban,
              kanbanStages: kanban.kanbanStages.map((stage) => ({
                ...stage,
                kanbanOrganizations: (stage.kanbanOrganizations || []).filter(
                  (org) =>
                    org && org.Organization && org.Organization.length > 0
                ),
              })),
            })),
          ];

          this.kanbanList.forEach((kanban) => {
            kanban.kanbanStages.forEach((stage) => {
              if (
                stage.kanbanOrganizations &&
                stage.kanbanOrganizations.length > 0
              ) {
                stage.kanbanOrganizations.sort((a: any, b: any) => {
                  const nameA = a.Organization[0].Name?.toLowerCase();
                  const nameB = b.Organization[0].Name?.toLowerCase();
                  return nameA?.localeCompare(nameB);
                });
              }
            });
          });

          this.lastKnownStageCount =
            this.kanbanList[0]?.kanbanStages?.length || 0;
        } else {
          this.kanbanList = [];
        }
      },
      error: (error) => {
        console.error('Error fetching kanban details:', error);
      },
    });
  }

  private checkForNewStagesAndOrganizations() {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: this.selectedKanban?.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const newData = data.json;
        const newStages = newData[0]?.kanbanStages || [];
        const currentStages = this.kanbanList[0]?.kanbanStages || [];

        if (this.isDataUnchanged(newStages, currentStages)) {
          return;
        }
        // Check for new stages
        if (newStages.length > this.lastKnownStageCount) {
          const newStageItems = newStages.filter(
            (newStage: KanbanStage) =>
              !currentStages.some(
                (currentStage) => currentStage.Id === newStage.Id
              )
          );

          newStageItems.forEach((newStage: KanbanStage) => {
            this.kanbanList[0].kanbanStages.push(newStage);
            this.GetStageActions(newStage);
          });

          this.lastKnownStageCount = newStages.length;
        }
        // Update existing stages and organizations with animation
        if (this.kanbanList[0].kanbanStages) {
          this.kanbanList[0].kanbanStages = currentStages.map(
            (currentStage: KanbanStage) => {
              const newStage = newStages.find(
                (stage: KanbanStage) => stage.Id === currentStage.Id
              );

              if (newStage) {
                const updatedOrgs = newStage.kanbanOrganizations
                  .filter(
                    (org: KanbanOrganization) =>
                      org && org.Organization && org.Organization.length > 0
                  )
                  .map((org: KanbanOrganization) => ({
                    ...org,
                    kanbanStageId: newStage.Id,
                  }));
                const movedOrgs = updatedOrgs.filter(
                  (updatedOrg: { Id: number }) =>
                    !currentStage.kanbanOrganizations.some(
                      (currentOrg) => currentOrg.Id === updatedOrg.Id
                    )
                );

                movedOrgs.forEach((org: KanbanOrganization) => {
                  const previousStage = currentStages.find((stage) =>
                    stage.kanbanOrganizations.some(
                      (currentOrg) => currentOrg.Id === org.Id
                    )
                  );
                  if (previousStage) {
                    const direction =
                      previousStage.Id < newStage.Id ? 'right' : 'left';
                    previousStage.kanbanOrganizations =
                      previousStage.kanbanOrganizations.filter(
                        (prevOrg) => prevOrg.Id !== org.Id
                      );
                  }
                });
                return {
                  ...currentStage,
                  kanbanOrganizations: updatedOrgs,
                };
              }
              return currentStage;
            }
          );
        }
        this.kanbanList = [...this.kanbanList];

        this.crf.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching Kanban details:', error);
      },
      complete: () => {
        this.crf.detectChanges();
      },
    });
  }

  private isDataUnchanged(
    newStages: KanbanStage[],
    currentStages: KanbanStage[]
  ): boolean {
    if (newStages.length !== currentStages.length) {
      return false;
    }

    for (let i = 0; i < newStages.length; i++) {
      const newStage = newStages[i];
      const currentStage = currentStages[i];

      if (
        newStage.Id !== currentStage.Id ||
        newStage.kanbanOrganizations.length !==
          currentStage.kanbanOrganizations.length
      ) {
        return false;
      }

      for (let j = 0; j < newStage.kanbanOrganizations.length; j++) {
        const newOrg = newStage.kanbanOrganizations[j];
        const currentOrg = currentStage.kanbanOrganizations[j];

        if (
          newOrg.Id !== currentOrg.Id ||
          newOrg.kanbanStageId !== currentOrg.kanbanStageId
        ) {
          return false;
        }
      }
    }
    return true;
  }

  checkForKanbanUpdates(): void {
    if (this.pollingUpdatesSubscription) {
      this.pollingUpdatesSubscription.unsubscribe();
    }
    this.pollingUpdatesSubscription = interval(30000)
      .pipe(takeWhile(() => this.isPollingActive))
      .subscribe(() => {
        this.checkForNewStagesAndOrganizations();
      });
  }

  GetUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && data.json.length > 0) {
          this.userKanbans = data.json;

          this.userKanbans.sort((a, b) => {
            if (a.kanbanTemplateId === b.kanbanTemplateId) {
              return a.kanbanName.localeCompare(b.kanbanName);
            }
            return a.kanbanTemplateId - b.kanbanTemplateId;
          });
        } else {
          this.userKanbans = [];
        }
      },
    });
  }

  GetKanbanDetails(kanban: Kanban) {
    this.activeKanbanId = kanban.Id;
    this.kanbanList = [];
    this.selectedKanban = kanban;
    this.isPollingActive = true;
    this.fetchKanbanDetails();
    this.checkForKanbanUpdates();
  }

  GetKanbanDetailsWithId(id: number) {
    this.kanbanList = [];

    const kanban = this.userKanbans.find((k) => k.Id == id);

    if (kanban) {
      this.activeKanbanId = kanban.Id;
      this.selectedKanban = kanban;
      this.isPollingActive = true;
      this.fetchKanbanDetails();
      this.checkForKanbanUpdates();
    }
  }

  GetStageActions(stage: KanbanStage): any {
    const body: any = {
      Name: 'GetStageActions',
      Params: { StageID: stage.Id },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        stage.stageActions = data.json;
      },
    });
  }

  getConnectedLists(currentId: string) {
    return this.kanbanList[0].kanbanStages
      .map((stage) => stage.Id.toString())
      .filter((id) => id !== currentId);
  }

  drop(event: CdkDragDrop<any[]>) {
    document.body.classList.add('dragging');

    let movedItem: KanbanOrganization;

    if (event.previousContainer === event.container) {
      movedItem = event.container.data[event.previousIndex];
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const newStageId = Number.parseInt(event.container.id, 10);
      movedItem.kanbanStageId = newStageId;
      const previousStageId = Number.parseInt(event.previousContainer.id, 10);
      this.removeOrganizationFromStage(movedItem, previousStageId);
    }

    setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 0);

    this.postDrag(movedItem);
  }

  removeOrganizationFromStage(
    organization: KanbanOrganization,
    stageId: number
  ) {
    const stage = this.kanbanList[0].kanbanStages.find(
      (s: KanbanStage) => s.Id === stageId
    );
    if (stage) {
      stage.kanbanOrganizations = (stage.kanbanOrganizations || [])
        .filter((org) => org.Id !== organization.Id)
        .filter(
          (org) => org && org.Organization && org.Organization.length > 0
        );
    }
  }

  postDrag(movedItem: KanbanOrganization) {
    const body: any = {
      name: 'UpdateKanbanOrganizationStage',
      params: {
        StageId: movedItem.kanbanStageId,
        kanbanOrganizationId: movedItem.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        // Immediately check for updates after the drag operation
        this.checkForNewStagesAndOrganizations();
      },
      error: (error) => {
        console.error('Error updating organization:', error);
        // Revert the change in the view if the API call fails
        this.checkForNewStagesAndOrganizations();
      },
    });
  }

  ngOnDestroy() {
    this.isPollingActive = false;
    if (this.pollingUpdatesSubscription) {
      this.pollingUpdatesSubscription.unsubscribe();
    }
  }
}
