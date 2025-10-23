import { NotificationService } from 'src/app/core/services/notification.service';
import {
  Component,
  OnInit,
  TemplateRef,
  HostListener,
  OnDestroy,
  Input,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef,
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
  campaignlogo: any;
  @Input() set viewMode(value: 'card' | 'table') {
    if (!this.isMobile) {
      this._viewMode = value;
      localStorage.setItem('campaignViewMode', value);
    }
  }
  get viewMode(): 'card' | 'table' {
    return this._viewMode;
  }
  private _viewMode: 'card' | 'table' = 'card';

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
  @ViewChild('campaignDetails') campaignDetailsTpl!: TemplateRef<any>;
  @ViewChild('addCampaign', { static: true }) addCampaignTpl!: TemplateRef<any>;
  selectedCampaign!: CampaignSpecs;

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

          // Compare with existing campaigns
          newCampaigns.forEach((newCamp) => {
            const oldCamp = this.campaigns.find((c) => c.Id === newCamp.Id);
            if (oldCamp && oldCamp.Sites !== newCamp.Sites) {
              this.markChanged(newCamp);
            }
          });

          this.campaigns = newCampaigns;
          this.filteredCampaigns = newCampaigns;
        } else {
          this.campaigns = [];
          this.filteredCampaigns = [];
        }

        this.getKanbanTemplateStages();
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
  }

  handleSave(locationData: any) {
    const isStandalone = this.campaignType === 'standalone';
    const campaignLocations = locationData.locationCriteria.locations.map(
      (loc: any) => ({
        State: loc.state,
        City: loc.city,
        NeighborhoodId: loc.neighborhoodId,
      })
    );

    this.placesService
      .CreateCampaign(
        this.campaignName,
        locationData.organizationId,
        isStandalone,
        campaignLocations
      )
      .subscribe({
        next: (response) => {
          this.modalRef?.close();
          this.resetAddCampaignForm();
          this.getAllCampaigns();
          // console.log(response);
          console.log(response.campaign);
          const campaignDetails = JSON.stringify(response.campaign);
          this.placesService
            .sendmessages({
              Chat: `display the specs of this campaign: ${campaignDetails}`,
              NeedToSaveIt: true,
            })
            .subscribe({
              next: (res) => {
                const notification = res.notification;
                this.notificationService.triggerOverlay(notification);
              },
            });
        },
        error: (err) => {},
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
  }

  closeMenu() {
    this.openMenuId = null;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    if (this.openMenuId !== null) {
      this.closeMenu();
    }
  }
  viewSpecs(campaign: any) {
    const body: any = {
      Name: 'GetCampaignDetailsJSON',
      Params: { CampaignId: campaign.Id },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        this.selectedCampaign = JSON.parse(
          response.json[0].campaignDetailsJSON
        );
        this.campaignlogo = campaign.logoUrl;

        this.modalService.open(this.campaignDetailsTpl, { size: 'xl' });
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
         
        this.placesService
          .sendmessages({
            Chat: `
            Edit this Campaign and Show the campaign specs, in a nice html representation
            Your purpose is to help the broker to complete the specs of the campaing named "${campaign.CampaignName}"
            and it's id is "${campaign.Id}".
            The campaign is for Tenant "${campaign.OrganizationName}"
            to expand in these locations in the json below:
            ${response.json[0].campaignDetailsJSON}
            gather any more specs and details from the broker, also offer him to search for these specs online`,
            NeedToSaveIt: true,
          })

          .subscribe({});
        // this.notificationService.sendmessage('Edit this Campaign');
      },
    });
  }
}
