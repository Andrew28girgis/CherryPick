import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Kanban } from 'src/models/userKanban';
import {
  KanbanCard,
  KanbanOrganization,
  StakeHolder,
  KanbanStage,
} from 'src/models/kanbans';
import { General } from 'src/models/domain';
import { FormArray, FormBuilder } from '@angular/forms';
import { KanbanTemplate } from 'src/models/kanbanTemplates';
import { KanbanAction } from 'src/models/kanbanActions';
import { Organization, OrganizationContact } from 'src/models/Organiztions'; 
 
@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent {
 
  General!: General;
  sidebarItems!: any[];
  collapse!: boolean;
  userKanbans: Kanban[] = [];
  kanbanList: KanbanCard[] = [];
  stackHolders: StakeHolder[] = [];
  selectedKanban?: Kanban;
  selectedStackHolderId?: number;
  kanbanTemplate: KanbanTemplate[] = [];
  KanbanActions: KanbanAction[] = [];
  TargetActions: KanbanAction[] = [];
  TargetOrg!: KanbanOrganization;
  Organizations: any[] = [];
  currentOpenedStage!: KanbanStage;
  allOrganizations: Organization[] = [];
  organizationContact: OrganizationContact[] = [];
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    this.sidebarItems = [
      {
        title: 'Dashboard',
        icon: 'fa-solid fa-house',
        link: '/dashboard',
      },
      {
        title: 'Stake holders',
        icon: 'fa-solid fa-list',
        link: '/kanban',
      },
      {
        title: 'Properties',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Tasks',
        icon: 'fa-solid fa-right-from-bracket',
        link: '/logout',
      },
      {
        title: 'Source',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Archive',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Corpus',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Permission',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
    ];
    this.collapse = false;
  }

  ngOnInit(): void {
    this.General = new General();
    this.GetUserKanbans();
    this.GetAllStakeHolders();
  }

  GetUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.userKanbans = data.json;
      },
    });
  }

  GetAllStakeHolders(): void {
    const body: any = {
      Name: 'GetAllStakeHolders',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.stackHolders = data.json;
      },
    });
  }

  getStackHolderName(stackHolderId: number) {
    let stack = this.stackHolders.filter((x) => x.id == stackHolderId);
    return stack[0]?.name;
  }

  GetKanbanDetails(kanban: Kanban) {
    this.selectedKanban = kanban;
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: kanban.Id,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.kanbanList = data.json;
        this.kanbanList[0].kanbanStages.forEach((stage) => {
          this.GetStageActions(stage);
        });
      },
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

  drop(event: CdkDragDrop<any[]>) {
    let movedItem;

    if (event.previousContainer === event.container) {
      // Moving within the same container
      movedItem = event.container.data[event.previousIndex];
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Moving to a different container
      movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update the kanbanStageId to reflect the new stage
      const newStageId = parseInt(event.container.id, 10); // Convert the container id to a number
      movedItem.kanbanStageId = newStageId;
    }

    this.postDrag(movedItem);
  }

  postDrag(movedItem: KanbanOrganization) {
    const { Organization, ...movedItemWithoutOrganization } = movedItem;

    let body: any = {};
    body.json = movedItemWithoutOrganization;
    body.mainEntity = 'kanbanOrganization';
    body.name = 'kanbanOrganizations';
    body.params = {};

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {},
    });
  }

  changeCollapse(): void {
    this.collapse = !this.collapse;
  }

  openCreateNewKanban(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'xl',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
    console.log(this.General.modalObject);

    this.GetKanbanMatchTemplate();
    this.getAllOrganizations();
  }

  GetKanbanMatchTemplate(): void {
    let StakeholderIds = [];

    this.selectedKanban?.kanbanDefinitions.forEach((definition) => {
      definition.Organization.forEach((org) => {
        StakeholderIds.push(org.stakeholderId);
      });
    });

    let movedOrg = this.General.modalObject.Organization[0]?.stakeholderId;
    if (movedOrg) {
      StakeholderIds.push(movedOrg);
    }

    let resultString = StakeholderIds.join(',');

    const body: any = {
      Name: 'GetKanbanMatchTemplate',
      Params: { StakeholderIds: resultString },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.kanbanTemplate = data.json;
      },
    });
  }

  onCreateClick() {
    let kanabanName = this.selectedKanban?.kanbanName;
    let targetStakeholderId = this.kanbanTemplate[0].targetStakeholderId;

    const kanbanDefinitions: any[] = [];

    this.selectedKanban?.kanbanDefinitions.forEach((definition: any) => {
      const kanbanDefinition = {
        contactId: definition.contactId,
        organizationId: definition.OrganizationId,
        PlaceId: null,
      };
      kanbanDefinitions.push(kanbanDefinition);
    });

    const kanbanNewDefinition = {
      organizationId: this.General.modalObject.OrganizationId,
    };

    kanbanDefinitions.push(kanbanNewDefinition);

    const kanbanStages: any[] = [];
    this.kanbanTemplate[0].kanbanTemplateStages.forEach((stage) => {
      const Stage = {
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        isQualified: stage.isQualified,
        kanbantemplatestageid: stage.Id,
      };
      kanbanStages.push(Stage);
    });

    let pay: any = {};
    pay.targetStakeholderId = targetStakeholderId;
    pay.kanbanName = kanabanName;
    pay.kanbanDefinitions = kanbanDefinitions;
    pay.kanbanStages = kanbanStages;

    const body: any = {
      Name: 'Kanaban',
      Params: {},
      json: pay,
      mainEntity: 'kanban',
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.GetUserKanbans();
      },
    });
  }

  // Start Actions

  openActionsForStage(content: any, stage?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'sm',
      scrollable: true,
      animation: true,
    });
    this.TargetActions = stage.stageActions;
    this.currentOpenedStage = stage;
  }

  openActionsForTarget(content: any, targetAction?: any, organization?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'sm',
      scrollable: true,
      animation: true,
    });
    this.TargetActions = targetAction;
    this.TargetOrg = organization;
  }

  openModel(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
  }

  CreateOrganication(name: string, stageId: number): void {
    const body: any = {
      Name: 'CreateOrganization',
      Params: { Name: name, kanbanStageId: stageId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        console.log(data);
      },
    });
  }

  SearchOrganication(name: string): void {
    const body: any = {
      Name: 'SearchOrganizationByName',
      Params: { Name: name },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Organizations = data.json;
      },
    });
  }

  AddExistingOrganication(stageId: number, orgId: string): void {
    const body: any = {
      Name: 'AddOrganizationToKanban',
      Params: { organizationid: orgId, kanbanstageid: stageId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {},
    });
  }

  //Route To Broker

  getAllOrganizations(): void {
    const body: any = {
      Name: 'GetAllOrganizations',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.allOrganizations = data.json;
      },
    });
  }

  getOrganizationContacts(event: any): void {
    let Organizationid = event.target.value;
    const body: any = {
      Name: 'GetOrganizationContacts',
      Params: { organizationid: Organizationid },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.organizationContact = data.json;
      },
    });
  }

  orgKanbans: Kanban[] = [];
  getContactKanbans(event: any): void {
    let ContactId = event.target.value;

    const body: any = {
      Name: 'GetContactKanbans',
      Params: { contactId: ContactId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.orgKanbans = data.json;
        console.log(`orgKanbans`, this.orgKanbans);
      },
    });
  }

  selectedTargetKanban!: number;

  CreateKanbanOrganization(): void {
    const body: any = {
      Name: 'CreateKanbanOrganization',
      Params: {
        OrganizationId: this.General.modalObject.Id,
        kanbanid: this.selectedTargetKanban,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        console.log(data.json);
      },
    });
  }

  keyword: string = '';
  searchResults: any[] = [];
  filteredNames: any[] = [];

  onSearchInput(): void {
    if (this.keyword.trim() === '') {
      this.filteredNames = [];
      return;
    }

    const body: any = {
      Name: 'SearchContact',
      Params: { keyword: '%' + this.keyword + '%' },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.searchResults = data.json;
        this.filteredNames = this.searchResults;
      },
      error: (err) => {
        console.error('Error fetching results:', err);
      },
    });
  }

  // Handle click on a name
  onNameClick(name: any): void {
    this.keyword =
      name.firstname + ' ' + name.lastname + ' ' + '(' + name.name + ')';
    this.filteredNames = [];

    const body: any = {
      Name: 'GetContactKanbans',
      Params: { contactId: name.id },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.orgKanbans = data.json;

        console.log(`orgKanbans`, this.orgKanbans);
      },
    });
  }
}
