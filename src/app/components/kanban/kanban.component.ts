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
import { IUserKanban } from 'src/app/shared/models/iuser-kanban';
import {
  IKanbanDetails,
  Organization,
} from 'src/app/shared/models/ikanban-details';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent implements OnInit, OnDestroy {
  kanbanTabs: { id: number; title: string }[] = [
    { id: 1, title: 'Tenants' },
    { id: 2, title: 'Organizations' },
    { id: 3, title: 'Properties' },
  ];
  selectedKanbanTabId: number = 1;
  private allUserKanbans: IUserKanban[] = [];
  userTenantsKanbans: IUserKanban[] = [];
  userTenantsKanbansDetails?: IKanbanDetails;
  userBuyBoxesKanbans: IUserKanban[] = [];
  userBuyBoxesKanbansDetails?: IKanbanDetails;
  userBuyBoxesPropertiesKanbans: IUserKanban[] = [];
  userBuyBoxesPropertiesKanbansDetails?: IKanbanDetails;
  selectedKanban?: IUserKanban;

  private lastKnownStageCount: number = 0;
  private pollingUpdatesSubscription?: Subscription;
  private isPollingActive: boolean = false;
  // private selectedKanban?: Kanban;
  userKanbans: Kanban[] = [];
  kanbanList: KanbanCard[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private crf: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getUserKanbans();

    this.activatedRoute.paramMap.subscribe((parms) => {
      const id = parms.get('id');

      if (id) {
        const fetchingKanbanDetailsInterval = setInterval(() => {
          if (this.allUserKanbans && this.allUserKanbans.length > 0) {
            clearInterval(fetchingKanbanDetailsInterval);
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

  getKanban(kanban: IUserKanban) {
    // this.activeKanbanId = kanban.Id;
    // this.kanbanList = [];
    this.userTenantsKanbansDetails = undefined;
    this.userBuyBoxesKanbansDetails = undefined;
    this.userBuyBoxesPropertiesKanbansDetails = undefined;

    this.selectedKanban = kanban;
    // debugger
    // this.isPollingActive = true;
    this.getKanbanDetails();
    // this.checkForKanbanUpdates();
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
          switch (this.selectedKanban?.targetStakeholderId) {
            case 2: {
              this.userTenantsKanbansDetails = data.json[0];
              if (this.userTenantsKanbansDetails) {
                this.sortKanbanDetailsOrganizations(
                  this.userTenantsKanbansDetails
                );
              }
              break;
            }
            case 4: {
              this.userBuyBoxesPropertiesKanbansDetails = data.json[0];
              if (this.userBuyBoxesPropertiesKanbansDetails) {
                this.sortKanbanDetailsCenters(
                  this.userBuyBoxesPropertiesKanbansDetails
                );
              }
              break;
            }
            default: {
              this.userBuyBoxesKanbansDetails = data.json[0];
              if (this.userBuyBoxesKanbansDetails) {
                this.sortKanbanDetailsOrganizations(
                  this.userBuyBoxesKanbansDetails
                );
              }
            }
          }

          // this.kanbanList = [
          //   ...data.json.map((kanban: KanbanCard) => ({
          //     ...kanban,
          //     kanbanStages: kanban.kanbanStages.map((stage) => ({
          //       ...stage,
          //       kanbanOrganizations: (stage.kanbanOrganizations || []).filter(
          //         (org) =>
          //           org && org.Organization && org.Organization.length > 0
          //       ),
          //     })),
          //   })),
          // ];

          // this.lastKnownStageCount =
          //   this.kanbanList[0]?.kanbanStages?.length || 0;
        } else {
          // this.kanbanList = [];
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
            const nameA = a.Name ? a.Name.toLowerCase() : '';
            const nameB = b.Name ? b.Name.toLowerCase() : '';
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

  onKanbanTabSelected(tabId: number): void {
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
      return this.userBuyBoxesKanbansDetails;
    } else if (this.selectedKanbanTabId == 3) {
      return this.userBuyBoxesPropertiesKanbansDetails;
    }
    return this.userTenantsKanbansDetails;
  }

  //

  // private fetchKanbanDetails() {
  //   const body: any = {
  //     Name: 'GetKanbanDetails',
  //     Params: {
  //       kanbanId: this.selectedKanban?.Id,
  //     },
  //   };

  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       if (data.json && data.json.length > 0) {
  //         this.kanbanList = [
  //           ...data.json.map((kanban: KanbanCard) => ({
  //             ...kanban,
  //             kanbanStages: kanban.kanbanStages.map((stage) => ({
  //               ...stage,
  //               kanbanOrganizations: (stage.kanbanOrganizations || []).filter(
  //                 (org) =>
  //                   org && org.Organization && org.Organization.length > 0
  //               ),
  //             })),
  //           })),
  //         ];

  //         this.kanbanList.forEach((kanban) => {
  //           kanban.kanbanStages.forEach((stage) => {
  //             if (
  //               stage.kanbanOrganizations &&
  //               stage.kanbanOrganizations.length > 0
  //             ) {
  //               stage.kanbanOrganizations.sort((a: any, b: any) => {
  //                 const nameA = a.Organization[0].Name?.toLowerCase();
  //                 const nameB = b.Organization[0].Name?.toLowerCase();
  //                 return nameA?.localeCompare(nameB);
  //               });
  //             }
  //           });
  //         });

  //         this.lastKnownStageCount =
  //           this.kanbanList[0]?.kanbanStages?.length || 0;
  //       } else {
  //         this.kanbanList = [];
  //       }
  //     },
  //   });
  // }

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

  private checkForNewStagesAndCenters() {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: this.selectedKanban?.Id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const newData = data.json;
        const newStages: KanbanStage[] = newData[0]?.kanbanStages || [];
        const currentStages: KanbanStage[] =
          this.kanbanList[0]?.kanbanStages || [];

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
        // Update existing stages with center data and animation
        if (this.kanbanList[0].kanbanStages) {
          this.kanbanList[0].kanbanStages = currentStages.map(
            (currentStage: KanbanStage) => {
              const newStage = newStages.find(
                (stage: KanbanStage) => stage.Id === currentStage.Id
              );
              if (newStage) {
                // Get the flattened centers for new and current stage
                const updatedCenters = this.getCentersForStage(newStage).map(
                  (center: any) => ({
                    ...center,
                    kanbanStageId: newStage.Id,
                  })
                );
                const currentCenters = this.getCentersForStage(currentStage);
                // Determine which centers have been newly added
                const movedCenters = updatedCenters.filter(
                  (updatedCenter: any) =>
                    !currentCenters.some(
                      (currentCenter: any) =>
                        currentCenter.Id === updatedCenter.Id
                    )
                );

                movedCenters.forEach((center: any) => {
                  // Find the stage from which the center came and remove it there
                  const previousStage = currentStages.find((stage) =>
                    this.getCentersForStage(stage).some(
                      (currentCenter: any) => currentCenter.Id === center.Id
                    )
                  );
                  if (previousStage) {
                    previousStage.kanbanOrganizations.forEach((org) => {
                      if (org.Organization?.[0]?.ShoppingCenters) {
                        org.Organization[0].ShoppingCenters =
                          org.Organization[0].ShoppingCenters.filter(
                            (c: any) => c.Id !== center.Id
                          );
                      }
                    });
                  }
                });
                // For center case, we simply replace the nested structure with the one from the new stage.
                return {
                  ...currentStage,
                  kanbanOrganizations: newStage.kanbanOrganizations,
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

  getCentersForStage(stage: KanbanStage): any[] {
    let centers: any[] = [];
    for (let org of stage.kanbanOrganizations || []) {
      if (org.Organization?.[0]?.ShoppingCenters?.length) {
        centers = centers.concat(org.Organization[0].ShoppingCenters);
      }
    }
    return centers;
  }

  drop(event: CdkDragDrop<any[]>, isProperty: boolean) {
    document.body.classList.add('dragging');

    let movedItem: KanbanOrganization;

    if (event.previousContainer === event.container) {
      console.log('1');

      movedItem = event.container.data[event.previousIndex];
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      console.log('2');
      console.log(event.previousContainer.data);
      console.log(event.previousContainer.data[event.previousIndex]);

      movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      console.log(movedItem);
      const newStageId = Number.parseInt(event.container.id, 10);
      movedItem.kanbanStageId = newStageId;

      const previousStageId = Number.parseInt(event.previousContainer.id, 10);
      isProperty
        ? this.removeCenterFromStage(movedItem, previousStageId)
        : this.removeOrganizationFromStage(movedItem, previousStageId);
    }

    setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 0);

    isProperty ? this.postDragProperty(movedItem) : this.postDrag(movedItem);
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

  removeCenterFromStage(center: any, stageId: number) {
    // Find the stage that matches the given stageId
    const stage = this.kanbanList[0].kanbanStages.find(
      (s: KanbanStage) => s.Id === stageId
    );

    if (stage) {
      // Iterate over each KanbanOrganization in the stage
      stage.kanbanOrganizations.forEach((org) => {
        // Ensure the Organization array exists and has an element,
        // and that ShoppingCenters is available on that element
        if (org.Organization?.[0]?.ShoppingCenters) {
          // Filter out the center that matches the one we want to remove
          org.Organization[0].ShoppingCenters =
            org.Organization[0].ShoppingCenters.filter(
              (c: any) => c.CenterName !== center.CenterName
            );
        }
      });
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
    });
  }

  postDragProperty(movedItem: any) {
    const body: any = {
      name: 'UpdatePlaceKanbanStage',
      params: {
        stageid: movedItem.kanbanStageId,
        marketsurveyid: movedItem.MarketSurveyShoppingCenters[0].MarketSurveyId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        // Immediately check for updates after the drag operation
        this.checkForNewStagesAndCenters();
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
