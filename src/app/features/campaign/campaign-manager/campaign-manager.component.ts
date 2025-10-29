import { NotificationService } from 'src/app/core/services/notification.service';
import {
  Component,
  OnInit,
  TemplateRef,
  HostListener,
  OnDestroy,
  Input,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { PlacesService } from 'src/app/core/services/places.service';
import {
  ICampaign,
  KanbanStage,
  Submission,
} from 'src/app/shared/models/icampaign';
import { EmilyService } from 'src/app/core/services/emily.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AddCampaignPopupComponent } from '../add-campaign-popup/add-campaign-popup.component';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { Tenant } from 'src/app/shared/models/tenant';
import { PolygonsComponent } from '../../polygons/polygons.component';
import { CampaignSpecs } from 'src/app/shared/models/campaignSpecs';
@Component({
  selector: 'app-campaign-manager',
  templateUrl: './campaign-manager.component.html',
  styleUrls: ['./campaign-manager.component.css'],
})
export class CampaignManagerComponent implements OnInit, OnDestroy {
  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;
  @ViewChild(PolygonsComponent, { static: false })
  polygonsComponentRef!: PolygonsComponent;

  @Input() hideViewToggles: boolean = false;
  @Input() forceReload: boolean = false;
  tempTenant: any;
  tempTenantId: any;
  specs: any;
  CampaignDetailsJSON: any;
  @Input() set viewMode(value: 'card' | 'table') {
    if (!this.isMobile) {
      this._viewMode = value;
      localStorage.setItem('campaignViewMode', value);
    }
  }
  get viewMode(): 'card' | 'table' {
    return this._viewMode;
  }
  private _viewMode: 'table' | 'card' = 'table';
  selectedTenants: any[] = [];
  userBuyBoxes: { id: number; name: string }[] = [];
  selectedBuyBoxId = 0;
  campaigns: ICampaign[] = [];
  filteredCampaigns?: ICampaign[];
  stages: { id: number; stageName: string }[] = [];
  searchCampaign = '';
  isMobile = false;

  // Loading state
  // Skeleton arrays for different views
  skeletonCardArray = Array(6).fill(0);
  skeletonTableArray = Array(10).fill(0);
  skeletonStagesArray = Array(4).fill(0);
  // Subscription to manage and clean up subscriptions
  private subscriptions = new Subscription();
  tenants: any[] = [];
  selectedTenant: any = null;
  polygonsStep = false;
  TenantStepLoad = false;
  step: 'tenant' | 'campaign' | 'polygon' = 'tenant';
  campaignName = '';
  campaignType: 'standalone' | 'standaloneShopping' | '' = '';
  private modalRef?: NgbModalRef;
  protected newTenant = {
    name: '',
    url: '',
    linkedin: '',
  };
  private newTenantId!: number;
  private newTenantName!: string;
  @ViewChild('tenantModal', { static: true })
  private tenantModal!: TemplateRef<any>;
  private createTenantModalRef?: NgbModalRef;
  private logoInterval: any;
  openMenuId: number | null = null;
  openOptionsId: number | null = null;
  @ViewChild('campaignDetails') campaignDetailsTpl!: TemplateRef<any>;
  @ViewChild('addCampaign', { static: true }) addCampaignTpl!: TemplateRef<any>;
  selectedCampaign!: CampaignSpecs;
  organizations: { id: number; name: string; logo: string }[] = [];
  selectedOrganizationId: number | 'all' = 'all';
  tenantSearch = '';
  cotenants: any[] = [];
  complementaryTenants: any[] = [];
  conflictingTenants: any[] = [];
  searchTimeout: any;
  MinUnitSize!: number;
  MaxUnitSize!: number;
  selectedCampaignDetails: any = null;
  campaignLogo: string = '';
  @ViewChild('campaignDetailsModal') campaignDetailsModal!: TemplateRef<any>;
  parsedCampaignDetails: { key: string; value: any }[] = [];
  isEditing = false;
  editableCampaign: any = {};

  constructor(
    private placesService: PlacesService,
    private notificationService: NotificationService,
    private modalService: NgbModal,
    private emilyService: EmilyService,
    private router: Router,
    private refreshService: RefreshService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['openAdd']) {
        this.openAddCampaign(this.addCampaignTpl);

        // Clean query params after opening modal
        this.router.navigate([], {
          queryParams: { openAdd: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });

    this.getAllCampaigns();
    this.refreshService.refreshOrganizations$.subscribe(() => {
      this.getAllCampaigns();
    });
    this.refreshService.polygonSavedData$.subscribe((data) => {
      this.placesService
        .sendmessages({ Chat: data, NeedToSaveIt: true })
        .subscribe({
          next: (res) => {
            this.modalRef?.close();
          },
        });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
    // On mobile, always use the responsive card view
    if (this.isMobile) {
      this.viewMode = 'card'; // Automatically switch to card view for mobile
    } else {
      // For larger screens, check localStorage for user preference
      const savedViewMode = localStorage.getItem('campaignViewMode') as
        | 'table'
        | 'card';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  toggleView(mode: 'table' | 'card'): void {
    this.viewMode = mode;
    // Save preference in localStorage
    localStorage.setItem('campaignViewMode', mode);
  }

  toggleExpand(campaign: any): void {
    campaign.expanded = !campaign.expanded;
  }

  getAllCampaigns(): void {
    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          const newCampaigns: ICampaign[] = response.json;

          this.campaigns = newCampaigns;
          this.filteredCampaigns = newCampaigns;

          const orgMap = new Map<number, { name: string; logoUrl: string }>();
          newCampaigns.forEach((c) => {
            if (c.OrganizationId && c.OrganizationName) {
              orgMap.set(c.OrganizationId, {
                name: c.OrganizationName,
                logoUrl: c.LogoUrl,
              });
            }
          });

          this.organizations = Array.from(orgMap, ([id, org]) => ({
            id,
            name: org.name,
            logo: org.logoUrl,
          }));

          this.getKanbanTemplateStages();
        } else {
          this.campaigns = [];
          this.filteredCampaigns = [];
          this.organizations = [];
        }
      },
    });

    this.subscriptions.add(subscription);
  }

  onSearchCampaign(): void {
    if (this.searchCampaign && this.searchCampaign.trim().length > 0) {
      this.filteredCampaigns = this.campaigns.filter((c) =>
        c.CampaignName?.toLowerCase().includes(
          this.searchCampaign?.toLowerCase()
        )
      );
    } else {
      this.filteredCampaigns = this.campaigns;
    }
  }

  onCampaignCreated(): void {
    this.getAllCampaigns();
    this.modalService.dismissAll();
  }

  openAddCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  goToEmily(campaign: ICampaign, index: number, withOrg: boolean): void {
    if (withOrg) {
      this.getCampaignOrganizations(campaign.OrganizationId, campaign.Id);
    }
  }

  getKanbanTemplateStages(): void {
    // this.isLoading = true;
    const body: any = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 },
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.stages = response.json;
        }
      },
    });

    this.subscriptions.add(subscription);
  }

  getCampaignOrganizations(buboxId: number, campaignId: number): void {
    const body: any = {
      Name: 'GetCampaignOrganizations',
      Params: { CampaignId: campaignId },
    };

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          const organizationsIds = [
            ...new Set(response.json.map((o: any) => o.organizationId)),
          ];
          const organizations: {
            id: number;
            contacts: any[];
          }[] = organizationsIds.map((id) => {
            return { id: id as number, contacts: [] };
          });
          const emilyObject: { buyboxId: number[]; organizations: any[] } = {
            buyboxId: [buboxId],
            organizations: organizations,
          };
          this.emilyService.updateCheckList(emilyObject);
          this.router.navigate(['/MutipleEmail', campaignId]);
        }
      },
    });

    this.subscriptions.add(subscription);
  }

  sortedSubmissions(submissions: Submission[]) {
    return (
      submissions?.sort(
        (a, b) =>
          this.statusSortOrder(a.StatusId) - this.statusSortOrder(b.StatusId)
      ) || []
    );
  }

  statusSortOrder(statusId: number | undefined): number {
    const order: { [key: number]: number } = { 0: 0, 1: 1, [-1]: 2 };
    return order[statusId ?? -1];
  }

  getStatusClass(statusId: number | undefined) {
    return {
      red: statusId === -1,
      normal: statusId === 0,
      green: statusId === 1,
    };
  }

  getSubmissionsCountNew(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == 0).length;
  }

  getSumbmissionsCountAcceppted(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == 1).length;
  }

  getSumbmissionsCountRejected(submissions: Submission[]) {
    return submissions.filter((s) => s.StatusId == -1).length;
  }

  getKanbanCount(stageName: string, kanbansList: KanbanStage[]): number {
    const kanbanStage = kanbansList?.find(
      (k) => k.stageName?.toLowerCase() === stageName?.toLowerCase()
    );
    return kanbanStage && kanbanStage.MarketSurveyShoppingCenters[0]?.Id
      ? kanbanStage.MarketSurveyShoppingCenters.length
      : 0;
  }

  protected openCampaignModal(): void {
    this.modalService.open(AddCampaignPopupComponent, {
      centered: true,
      size: 'xl',
    });
  }

  protected navigateToCampaign(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/campaigns/add-campaign'], {
      queryParams: {
        minSize: this.campaignMinSize,
        maxSize: this.campaignMaxSize,
      },
    });
  }
  stageClass(name: string): string {
    const n = (name || '')?.toLowerCase();
    if (n.includes('accept') || n.includes('approved') || n.includes('success'))
      return 'is-accepted';
    if (n.includes('reject') || n.includes('decline') || n.includes('failed'))
      return 'is-rejected';
    if (n.includes('new') || n.includes('pending') || n.includes('open'))
      return 'is-new';
    return 'is-neutral';
  }
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  // openEmilyWithMap() {
  //   this.notificationService.setChatOpen(true);
  //   this.notificationService.setMapOpen(true);
  //   this.notificationService.setOverlayWide(true);
  // }

  getAllActiveOrganizations(onLoaded?: () => void, onEmpty?: () => void): void {
    const body: any = {
      Name: 'GetAllActiveOrganizations',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.tenants = data?.json || data?.Result || [];

        if (!this.tenants || this.tenants.length === 0) {
          if (onEmpty) onEmpty();
          return;
        }

        if (onLoaded) onLoaded();
      },
    });
  }

  openAddCampaign(content: TemplateRef<any>) {
    this.TenantStepLoad = true;
    this.selectedTenant = null;
    this.step = 'tenant';
    this.polygonsStep = false;
    this.modalRef = this.modalService.open(content, { size: 'xl' });

    this.getAllActiveOrganizations(
      () => {
        this.TenantStepLoad = false;
      },
      () => {
        this.TenantStepLoad = false;
      }
    );
  }

  selectTenant(tenant: any) {
    this.selectedTenant = tenant;
  }
  nextStep() {
    // Step 1: Tenant → Campaign
    if (this.step === 'tenant') {
      if (!this.selectedTenant) return;
      this.step = 'campaign';
      this.polygonsStep = false;
      return;
    }

    // Step 2: Campaign → Polygon
    if (this.step === 'campaign') {
      this.saveSelectedTenants();
      // const campaignData = {
      //   name: this.campaignName,
      //   type: this.campaignType,
      //   minSize: this.MinUnitSize,
      //   maxSize: this.MaxUnitSize,
      //   complementaryTenants: this.complementaryTenants,
      //   conflictingTenants: this.conflictingTenants,
      // };
      // console.log('Campaign step data:', campaignData);

      if (!this.campaignName || !this.campaignType) return;
      this.step = 'polygon';
      this.polygonsStep = true;
      return;
    }
  }

  prevStep() {
    // Step back from Polygon → Campaign
    if (this.step === 'polygon') {
      this.step = 'campaign';
      this.polygonsStep = false;
      return;
    }

    // Step back from Campaign → Tenant
    if (this.step === 'campaign') {
      this.step = 'tenant';
      this.polygonsStep = false;
      return;
    }
  }

  finish(): void {
    if (!this.selectedTenant) return;

    this.refreshService.requestPolygonSave(this.selectedTenant.id);
  }

  private resetAddCampaignForm(): void {
    this.selectedTenant = null;
    this.campaignName = '';
    this.campaignType = '';
    this.polygonsStep = false;
    this.step = 'tenant';
    this.selectedTenants = [];
    this.cotenants = [];
    this.complementaryTenants = [];
    this.conflictingTenants = [];
    this.tenantSearch = '';
  }

  handleSave(locationData: any) {
    const isStandalone = this.campaignType === 'standalone';

    const campaignLocations = locationData.locationCriteria.locations.map(
      (loc: any) => ({
        State: loc.state ?? '',
        City: loc.city,
        NeighborhoodId: loc.neighborhoodId ?? loc.polygonId ?? null,
      })
    );

    console.log('✅ campaignLocations to send:', campaignLocations);
    this.placesService
      .CreateCampaign(
        this.campaignName,
        this.selectedTenant.id,
        this.selectedTenant.name,
        isStandalone,
        campaignLocations,
        this.MinUnitSize,
        this.MaxUnitSize,
        this.selectedTenants
      )
      .subscribe({
        next: (response) => {
          this.modalRef?.close();
          this.getAllCampaigns();

          console.log('CreateCampaign response:', response);
          const campaignDetails = JSON.stringify(response.campaign);

          // trigger Emily chat / assistant display
          console.log('sdsaaaaaaaaaaaaaaaa', this.selectedTenants);
          const selectedTenantsInfo = JSON.stringify(this.selectedTenants);
          this.placesService
            .sendmessages({
              Chat: `display the specs of this campaign and skip any id: ${campaignDetails}, Organization Name: ${this.selectedTenant.name} and here is the organization Relations Data get from them the names and types and skip the Ids ${selectedTenantsInfo}`,
              NeedToSaveIt: true,
            })
            .subscribe({
              next: (res) => {
                const notification = res.notification;
                this.notificationService.triggerOverlay(notification);
              },
            });
          this.resetAddCampaignForm();
        },
        error: (err) => {
          console.error('CreateCampaign error:', err);
        },
      });
  }

  protected addNewTenant() {
    const prevTenantId = this.selectedTenant?.id;
    this.tempTenantId = prevTenantId;
    if (!this.newTenant.name.trim().length) return;
    this.createNewTenant(() => {
      this.selectedTenant = this.tenants.find((t) => t.id === prevTenantId);
    });
  }

  protected openAddTenantModal(content: any): void {
    this.createTenantModalRef = this.modalService.open(content, {
      centered: true,
    });
  }

  private createNewTenant(onDone?: () => void) {
    const body = {
      Name: 'CreateOrganizationByName',
      Params: {
        Name: this.newTenant.name,
        URL: this.newTenant.url.trim().length ? this.newTenant.url : '',
        LinkedIn: this.newTenant.linkedin.trim().length
          ? this.newTenant.linkedin
          : '',
      },
    };

    this.placesService.GenericAPI(body).subscribe((orgResponse: any) => {
      this.getAllActiveOrganizations(() => {
        if (onDone) onDone();
      });

      const orgId = orgResponse?.json?.[0]?.id;
      const orgName = orgResponse?.json?.[0]?.name;
      if (!orgId) {
        alert('Tenant creation failed. Please try again.');
        return;
      } else {
        this.newTenantId = orgId;
        this.newTenantName = orgName;
        this.createTenantModalRef?.close();
        this.resetAddTenantForm();
        // this.openCampaignModal();
        this.startLogoPolling(orgId);
      }
    });
  }
  private resetAddTenantForm() {
    this.newTenant = { name: '', url: '', linkedin: '' };
  }

  private startLogoPolling(orgId: string) {
    if (this.logoInterval) clearInterval(this.logoInterval);

    this.logoInterval = setInterval(() => {
      this.getAllActiveOrganizations(() => {
        const tenant = this.tenants.find((t) => t.id === orgId);
        if (tenant) {
          // select created teannt after creation
          this.selectedTenant = tenant;

          // select previous selected  teannt before creation
          // this.selectedTenant = this.tenants.find((t) => t.id === this.tempTenantId);

          // stop polling once logo exists
          if (tenant.logoUrl) {
            clearInterval(this.logoInterval);
            this.logoInterval = null;
          }
        }
      });
    }, 2000);
  }

  markChanged(campaign: ICampaign) {
    campaign.changed = true;
    setTimeout(() => (campaign.changed = false), 600);
  }
  toggleMenu(scId: number, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === scId ? null : scId;
    this.openOptionsId = this.openOptionsId === scId ? null : scId;
  }

  closeMenu() {
    this.openMenuId = null;
    this.openOptionsId = null;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    if (this.openMenuId !== null) {
      this.closeMenu();
    }
  }
  //   viewSpecs(campaign: any) {
  //     const body: any = {
  //       Name: 'GetCampaignDetailsJSON',
  //       Params: { CampaignId: campaign.Id },
  //     };

  //     this.placesService.GenericAPI(body).subscribe({
  //       next: (response) => {
  //         this.selectedCampaign = JSON.parse(
  //           response.json[0].campaignDetailsJSON
  //         );
  //         this.campaignlogo = campaign.logoUrl;
  //         this.placesService
  //           .sendmessages({
  //             Chat: `
  //           Show the Campaign and display all campaign specifications — every field in the JSON must be shown (no field should be ignored or hidden).
  //           Present all the data in a clean, organized HTML layout that’s easy for the user to read and navigate.
  //           The campaign name is "${campaign.CampaignName}"
  //           Its ID is "${campaign.Id}"
  //           The campaign belongs to the tenant "${campaign.OrganizationName}"
  //           and aims to expand in the following locations from the JSON below:
  //           ${response.json[0].campaignDetailsJSON}
  //           Your goal is to show the full JSON data beautifully in HTML and help the user continue or complete any missing campaign specifications.
  // `,
  //             NeedToSaveIt: true,
  //           })
  //           .subscribe({});
  //         // this.modalService.open(this.campaignDetailsTpl, { size: 'xl' });
  //       },
  //     });
  //   }

  viewSpecsNew(campaign: any, edit?: boolean) {
    const body: any = {
      Name: 'GetCampaignFullDetails',
      Params: { CampaignId: campaign.Id },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        const data = response.json;
        this.selectedCampaignDetails = data;
        this.campaignLogo = data.LogoURL;

        // Parse CampaignDetailsJSON to bring hidden fields like IsStandAlone
        try {
          const parsed = JSON.parse(data.CampaignDetailsJSON);
          this.parsedCampaignDetails = this.getKeyValuePairs(parsed);

          // ✅ Merge any missing fields into selectedCampaignDetails
          this.selectedCampaignDetails = {
            ...data,
            ...parsed,
          };
        } catch {
          this.parsedCampaignDetails = [];
        }
        if (edit) {
          this.startEdit();
        }
        const modalRef = this.modalService.open(this.campaignDetailsModal, {
          size: 'lg',
          centered: true,
          scrollable: true,
        });
        modalRef.result.finally(() => {
          this.isEditing = false;
          this.editableCampaign = {}; // optional: clear data
        });
      },
    });
  }

  deleteCampaign(campaignId: number) {
    const body: any = {
      Name: 'DeleteCampaign',
      Params: { CampaignId: campaignId },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: () => {
        this.getAllCampaigns();
      },
    });
  }
  getArrayFromValue(value: string | string[] | null | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value.split(',').map((v) => v.trim());
  }
  editCampaign(campaign: any) {
    const body: any = {
      Name: 'GetCampaignDetailsJSON',
      Params: { CampaignId: campaign.Id },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        this.selectedCampaign = JSON.parse(
          response.json[0].campaignDetailsJSON
        );

        this.insertNotifcation(
          `Let's update the '${campaign.CampaignName}' campaign details for '${campaign.OrganizationName}', i am preparing the campaign specs`
        );
        this.placesService
          .sendmessages({
            Chat: `
            Display and edit the campaign details. Show all available campaign specifications — do not omit or summarize any field.
Present the full campaign specs in a clean, well-structured HTML layout suitable for the user to view and edit.

The campaign’s name is "${campaign.CampaignName}" with ID "${campaign.Id}", created for Tenant "${campaign.OrganizationName}".
The campaign aims to expand into the following locations (from the JSON below):
${response.json[0].campaignDetailsJSON}

Your goal is to assist the broker in reviewing and completing any missing campaign specifications.
Encourage the broker to provide any missing details, and if needed, offer to search online for more campaign specs to complete the information.`,
            NeedToSaveIt: true,
          })

          .subscribe({});
        // this.notificationService.sendmessage('Edit this Campaign');
      },
    });
  }
  insertNotifcation(chat: string) {
    const genericInput = {
      Name: 'InsertNotificationFromAutomation',
      Params: {
        Message: chat,
        HTML: null,
        CampaignId: null,
        NotificationCategoryId: 2,
      },
    };
    this.placesService.GenericAPI(genericInput).subscribe({});
  }
  filterByOrganization(orgId: number | 'all'): void {
    this.selectedOrganizationId = orgId;
    if (orgId === 'all') {
      this.filteredCampaigns = this.campaigns;
    } else {
      this.filteredCampaigns = this.campaigns.filter(
        (c) => c.OrganizationId === orgId
      );
    }
  }

  onTenantSearchChange(value: string) {
    this.tenantSearch = value;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (value.length < 3) {
      this.cotenants = [];
      return;
    }
    this.searchTimeout = setTimeout(() => {
      const body = {
        Name: 'GetOrgByName',
        Params: { OrgName: value },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          const data = res.json || [];
          this.cotenants = data.map((t: any) => ({
            name: t.name,
            logoURL: t.logoURL,
            id: t.id,
          }));
        },
        error: (err) => console.error('Error loading tenants', err),
      });
    }, 300);
  }

  addComplementary(tenant: any) {
    const isAlreadyComplementary = this.complementaryTenants.some(
      (t) => t.name === tenant.name
    );
    const isAlreadyConflicting = this.conflictingTenants.some(
      (t) => t.name === tenant.name
    );

    if (isAlreadyComplementary) {
      this.complementaryTenants = this.complementaryTenants.filter(
        (t) => t.name !== tenant.name
      );
      return;
    }

    if (isAlreadyConflicting) {
      this.conflictingTenants = this.conflictingTenants.filter(
        (t) => t.name !== tenant.name
      );
    }

    this.complementaryTenants.push(tenant);
  }

  addConflicting(tenant: any) {
    const isAlreadyConflicting = this.conflictingTenants.some(
      (t) => t.name === tenant.name
    );
    const isAlreadyComplementary = this.complementaryTenants.some(
      (t) => t.name === tenant.name
    );

    if (isAlreadyConflicting) {
      this.conflictingTenants = this.conflictingTenants.filter(
        (t) => t.name !== tenant.name
      );
      return;
    }

    if (isAlreadyComplementary) {
      this.complementaryTenants = this.complementaryTenants.filter(
        (t) => t.name !== tenant.name
      );
    }

    this.conflictingTenants.push(tenant);
  }

  isSelected(tenant: any, type: 'complementary' | 'conflicting'): boolean {
    if (type === 'complementary') {
      return this.complementaryTenants.some((t) => t.name === tenant.name);
    }
    return this.conflictingTenants.some((t) => t.name === tenant.name);
  }
  saveSelectedTenants() {
    this.selectedTenants = [
      ...this.complementaryTenants.map((t) => ({
        RelationOrgId: t.id,
        RetailRelationCategoryId: 5, // Complementary ID
        RetailRelationCategoryName: 'complmentary', // Complementary ID
        relationOrgName: t.name,
        IsAdded: true,
      })),

      ...this.conflictingTenants.map((t) => ({
        RelationOrgId: t.id,
        RetailRelationCategoryId: 6, // Conflicting ID
        RetailRelationCategoryName: 'conflicting', // Complementary ID
        relationOrgName: t.name,
        IsAdded: true,
      })),
    ];

    console.log('Selected tenants payload:', this.selectedTenants);
  }
  getKeyValuePairs(obj: any): { key: string; value: any }[] {
    if (!obj || typeof obj !== 'object') return [];

    return Object.entries(obj)
      .filter(([_, value]) => this.hasValue(value))
      .map(([key, value]) => ({ key, value }));
  }

  hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some((v) => this.hasValue(v));
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  startEdit() {
    this.isEditing = true;
    this.editableCampaign = JSON.parse(
      JSON.stringify(this.selectedCampaignDetails)
    );
  }

  cancelEdit() {
    this.isEditing = false;
    this.editableCampaign = {};
  }

  saveEdit() {
    const updated = this.editableCampaign;

    // 🔧 Convert Relations into the expected DTO shape
    const organizationRelationsDTO = (updated.Relations || []).map(
      (r: any) => ({
        RelationOrgId: r.RelationOrgId ?? r.RelationOrgId ?? null,
        RetailRelationCategoryId: r.RelationType === 'complementary' ? 5 : 6,
        RetailRelationCategoryName:
          r.RelationType === 'complementary' ? 'complmentary' : 'conflicting',
        relationOrgName: r.RelationOrganizationName,
        IsAdded: (r.IsAdded===true||r.IsAdded === undefined ) ? true : r.IsAdded,
      })
    );

    // 🔧 Convert Locations into expected format
    const campaignLocations = (updated.Locations || []).map((loc: any) => ({
      State: loc.State,
      City: loc.CityName,
      NeighborhoodId: null,
    }));

    const body = {
      CampaignId: updated.CampaignId,
      CampaignName: updated.CampaignName,
      OrganizationId: updated.OrganizationId,
      name: updated.OrganizationName,
      IsStandAlone: updated.IsStandAlone,
      CampaignLocations: campaignLocations,
      MinUnitSize: updated.MinUnitSize,
      MaxUnitSize: updated.MaxUnitSize,
      OrganizationRelationsDTO: organizationRelationsDTO,
    };

    console.log('Update body:', body); // Debug payload

    this.placesService
      .UpdateCampaign(
        body.CampaignId,
        body.CampaignName,
        body.OrganizationId,
        body.name,
        body.IsStandAlone,
        body.CampaignLocations,
        body.MinUnitSize,
        body.MaxUnitSize,
        body.OrganizationRelationsDTO
      )
      .subscribe({
        next: (res) => {
          console.log('Campaign updated:', res);
          this.selectedCampaignDetails = updated;
          this.isEditing = false;
          this.getAllCampaigns();
          this.modalService.dismissAll();
        },
        error: (err) => {
          console.error('Update failed:', err);
        },
      });
    this.isEditing = false;
  }
  removeRelation(index: number) {
    this.editableCampaign.Relations[index].IsAdded = false;
  }
}
