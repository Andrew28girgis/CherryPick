import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { Fbo } from 'src/models/domain';
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
  Organization,
  LeadBroker,
} from 'src/models/kanbans';
import { General } from 'src/models/domain';
import { FormArray, FormBuilder,FormGroup, Validators } from '@angular/forms';
import { KanbanTemplate } from 'src/models/kanbanTemplates';
import { KanbanAction } from 'src/models/kanbanActions';
import {  OrganizationContact } from 'src/models/Organiztions';
import { ToastrService } from 'ngx-toastr';
import { retry, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent {
  @ViewChild(FilterPanelComponent) filterPanel!: FilterPanelComponent;
  @Input() isInactive: boolean = false;
  isMobileMenuOpen = false;
isMobileView = false;

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
  keyword: string = '';
  searchResults: any[] = [];
  filteredNames: any[] = [];
  activeTab: string = 'In Progress';
  activeFilter: string = 'Prospect';
  showFilterSidebar: boolean = false;
  showTableWrapper: boolean = false; // Added property
  hiddenOrganizations: { [key: number]: boolean } = {}; // Tracks visibility of organization names
  isStakeholderHidden: boolean = false; // Tracks visibility of stakeholder name
  mobileNavOpen: boolean = false;
  sidebarCollapsed: boolean = false;
  isOpen: boolean = false;
  newOrganizationForm!: FormGroup;
  isLoading = false;
  selectedBroker: any = null; // Added: selectedBroker property
  searchText: string = '';
  filteredKanbanList: KanbanCard[] = [];

  // kanbanStages: any[] = [];
  kanbanStages: KanbanStage[] = []; // Initialize kanbanStages array
  @Output() kanbanCreated = new EventEmitter<any>();
  showFilter: boolean = false; // Add this property

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,

    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.initNewOrganizationForm();
  }
  private loadProperties(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
    }, 0);
  }
  ngOnInit(): void {
    this.kanbanStages = []; // Initialize kanbanStages array
    this.General = new General();
    this.GetUserKanbans();
    this.GetAllStakeHolders();
    this.loadProperties();
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
        this.sidebarCollapsed = JSON.parse(savedState);
    }
    this.checkMobileView();

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
        console.log('Kanban details response:', data);
        this.kanbanList = data.json;
        this.filteredKanbanList = [...this.kanbanList]; // Initialize filteredKanbanList with all data
        if (this.kanbanList && this.kanbanList[0]?.kanbanStages) {
          this.kanbanList[0].kanbanStages.forEach((stage) => {
            this.GetStageActions(stage);
          });
        } else {
          console.error('Invalid kanban data structure:', this.kanbanList);
        }
      },
      error: (error) => {
        console.error('Error fetching kanban details:', error);
      }
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
    // Temporarily disable animations
    document.body.classList.add('dragging');
    
    let movedItem;
    if (event.previousContainer === event.container) {
      movedItem = event.container.data[event.previousIndex];
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const newStageId = parseInt(event.container.id, 10);
      movedItem.kanbanStageId = newStageId;
    }

    // Re-enable animations after drag
    setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 0);

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
    this.initNewOrganizationForm();
    this.GetKanbanMatchTemplate();
    // this.getAllOrganizations();
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

    let resultString = StakeholderIds.join('  ');

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

  onCreateClick(selectedTemplate: KanbanTemplate) {
    let kanabanName = this.selectedKanban?.kanbanName;
    let targetStakeholderId = this.kanbanTemplate[0].targetStakeholderId;
   this.createKanbanByTemplate(selectedTemplate);

    const kanbanDefinitions: any[] = [];

    selectedTemplate.kanbanTemplateStages.forEach((stage) => {
      const Stage = {
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        isQualified: stage.isQualified,
        kanbantemplatestageid: stage.Id,
      };
      // kanbanStages.push(Stage);
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
    this.modalService.dismissAll();

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

  CreateOrganication() {
    if (this.newOrganizationForm.valid) {
      const newOrg = this.newOrganizationForm.value;
      const body: any = {
        Name: 'CreateOrganization',
        Params: { 
          ...newOrg,
          kanbanStageId: this.currentOpenedStage.Id 
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (data) => {
          console.log('Organization created:', data);
          this.GetKanbanDetails(this.selectedKanban!);
          this.modalService.dismissAll();
        },
        error: (err) => {
          console.error('Error creating organization:', err);
        }
      });
    }
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
      next: (data) => {
        console.log('Organization added to Kanban:', data);
        this.GetKanbanDetails(this.selectedKanban!);
        this.modalService.dismissAll();
      },
      error: (err) => {
        console.error('Error adding organization to Kanban:', err);
      }
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

  onSearchInput(): void {
    const trimmedKeyword = this.keyword.trim();
    
    if (trimmedKeyword.length <= 2) {
      this.filteredNames = [];
      return;
    }
  
    const body: any = {
      Name: 'SearchContact',
      Params: { keyword: '%' + trimmedKeyword + '%' },
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
    this.selectedBroker = name;
  this.keyword = `${name.firstname} ${name.lastname} (${name.name})`;
  this.filteredNames = [];
  this.toastr.success('Broker selected');

  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
    // this.filterKanbanList();
  }

  onSearchIconClick(): void {
    console.log('Search icon clicked!');
    // Add search logic here
  }

  // Add this method to your component
  toggleFilterSidebar(): void {
    this.showFilterSidebar = !this.showFilterSidebar;
  }
  toggleFilter() {
    this.filterPanel.toggle();
  }

  onFilterChange(filters: any) {
    console.log('Filters changed:', filters);
    // Apply the filters to your data here
  }
  isRouteActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  toggleTableWrapper(): void {
    // Added method
    this.showTableWrapper = !this.showTableWrapper;
  }
  hideOrganization(index: number): void {
    this.hiddenOrganizations[index] = true;
  }

  // Method to hide the stakeholder name
  hideStakeholder(): void {
    this.isStakeholderHidden = true;
  }
  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }
  checkMobileView() {
    // this.isMobileView = window.innerWidth <= 768;
    // if (!this.isMobileView && this.isMobileMenuOpen) {
    //   // this.isMobileMenuOpen = false;
    // }
  }

  initNewOrganizationForm() {
    this.newOrganizationForm = this.fb.group({
      name: ['', Validators.required],
      location: [''],
      assetType: [''],
      totalProperties: [0, Validators.min(0)],
      leadBrokerName: ['']
    });
  }
  














  createKanbanByTemplate(selectedTemplate: KanbanTemplate): void {
    if (!this.selectedBroker) {
      // Assuming toastr is injected.  Replace with your error handling.
      console.error('Please select a broker before creating a Kanban.'); //Replace with toastr.error
      return;
    }

    const templateId = selectedTemplate.Id;
    const prevKanbanId = this.selectedKanban?.Id;
    const targetOrganizationId = this.General.modalObject?.OrganizationId;

    const selectedOrg = this.General.modalObject?.Organization?.[0];
    const kanbanOwnerContactId = this.selectedBroker.id ;
    const kanbanOwnerOrganizationId = this.selectedBroker.id1;
    const placeId = selectedOrg?.PlaceId || null;

    console.log('Template ID:', templateId);
    console.log('Previous Kanban ID:', prevKanbanId);
    console.log('Target Organization ID:', targetOrganizationId);
    console.log('Kanban Owner Contact ID:', kanbanOwnerContactId);
    console.log('Kanban Owner Organization ID:', kanbanOwnerOrganizationId);
    console.log('Place ID:', placeId);

    if (!templateId || !targetOrganizationId) {
      console.error('Missing required parameters');
      // Show error to user
      return;
    }

    const body: any = {
      Name: 'CreateKanbanByTemplate',
      Params: {
        templateId,
        prevKanbanId,
        targetOrganizationId,
        kanbanOwnerContactId,
        kanbanOwnerOrganizationId,
        placeId,
        // brokerId: this.selectedBroker.id // Add this line
      }
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.error) {
          console.error('Error creating kanban:', response.error);
          // Show error to user
          return;
        }
        console.log('Kanban created successfully:', response);
        this.GetUserKanbans();
        this.modalService.dismissAll();
      },
      error: (error) => {
        console.error('Error creating kanban:', error);
        // Show error to user
      }
    });
  }



  filterKanbanData(): void {
    if (!this.searchText.trim()) {
      this.filteredKanbanList = [...this.kanbanList];
      return;
    }
  
    const searchLower = this.searchText.toLowerCase().trim();
    this.filteredKanbanList = this.kanbanList.map(kanban => ({
      ...kanban,
      kanbanStages: kanban.kanbanStages.map(stage => ({
        ...stage,
        kanbanOrganizations: stage.kanbanOrganizations.filter(org =>
          org.Organization?.[0]?.Name?.toLowerCase().includes(searchLower) ||
          org.Organization?.[0]?.Location?.toLowerCase().includes(searchLower) ||
          org.Organization?.[0]?.AssetType?.toLowerCase().includes(searchLower) ||
          org.LeadBroker?.Name?.toLowerCase().includes(searchLower) ||
          stage.stageName.toLowerCase().includes(searchLower)
        )
      })).filter(stage => stage.kanbanOrganizations.length > 0)
    })).filter(kanban => kanban.kanbanStages.length > 0);
  }
  
  onSearchChange(event: any): void {
    this.searchText = event.target.value;
    this.filterKanbanData();
  }

  toggleCard(org: KanbanOrganization): void {
    org.isExpanded = !org.isExpanded;
  }
}