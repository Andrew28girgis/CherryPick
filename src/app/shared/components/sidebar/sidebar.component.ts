import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PlacesService } from 'src/app/core/services/places.service';
import { SidbarService } from 'src/app/core/services/sidbar.service';
import { UserViewService } from 'src/app/core/services/user-view.service';
import { IUserKanban } from '../../models/iuser-kanban';
import {
  buyboxChecklist,
  cadenceSidebar,
  ContactsChecked,
  IBuyBoxContact,
  IBuyboxOrganization,
  IUserBuybox,
  OrganizationChecked,
} from '../../models/sidenavbar';
import { IKanbanDetails } from '../../models/ikanban-details';
import { CadenceService } from 'src/app/core/services/cadence.service';
import { EmilyService } from 'src/app/core/services/emily.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSmallScreen: boolean = window.innerWidth < 992;
  isSidebarExpanded: boolean = false; // Default collapsed state
  isHovering: boolean = false;
  kanbanId$!: Observable<number>;
  // Add output event to notify parent of hover state changes
  @Output() hoverStateChange = new EventEmitter<boolean>();

  @HostListener('window:resize', [])
  onResize() {
    this.isSmallScreen = window.innerWidth < 992;
  }

  // New variable that will hold the current route URL.
  current: string = '';
  currentView: 'tenant' | 'landlord' = 'tenant';

  private viewSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  userBuyboxes: IUserBuybox[] = [];
  buyboxOrganizations: IBuyboxOrganization[] = [];
  BuyBoxContacts: IBuyBoxContact[] = [];

  constructor(
    private sidbarService: SidbarService,
    public router: Router,
    private userViewService: UserViewService,
    private PlacesService: PlacesService,
    protected cadenceService: CadenceService,
    protected cdr: ChangeDetectorRef  ,
    private EmilyService: EmilyService 
  ) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isSidebarExpanded = !state;
      this.sidbarService.setSidebarState(this.isSidebarExpanded);
    });
  }

  ngOnInit(): void {
    this.getUserKanbans();
    this.getUserBuyBoxes();
    this.isSmallScreen = window.innerWidth < 992;
    this.isSidebarExpanded = false;
    this.sidbarService.setSidebarState(this.isSidebarExpanded);
    this.routerSubscription = this.router.events
      .pipe(
        filter(
          (event: RouterEvent): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.current = event.urlAfterRedirects;
      });

    // Initialize `current` with the current URL.
    this.current = this.router.url;

    // Subscribe to view changes if needed.
    this.viewSubscription = this.userViewService.currentView$.subscribe(
      (view) => {
        this.currentView = view;
      }
    );
    this.kanbanId$ = this.cadenceService.getKanbanId();

    this.cadenceService.getKanbanId().subscribe((kanbanId) => {
      if (kanbanId) {
        this.sideKanban.tenantOrganizations.forEach((o) => {
          this.kanbanId$.subscribe((kanbanId) => {
            if (o.OtherKanbans.find((k) => k.id == kanbanId)) {
              o.isOpen = true;
            }
          });
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleSidebar(event: Event) {
    event.stopPropagation();
    this.isSidebarExpanded = !this.isSidebarExpanded;
    this.sidbarService.toggleSidebar();
  }

  onSidebarHover(isHovering: boolean) {
    if (!this.isSidebarExpanded) {
      this.isHovering = isHovering;
      this.hoverStateChange.emit(isHovering);
    }
  }

  // Cadence
  protected allUserKanbans: IUserKanban[] = [];
  sideKanban: cadenceSidebar = { tenantOrganizations: [] }; // Initialize with a default value
  cadenceIsOpen = false;
  emilyIsOpen = false;

  private getUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.allUserKanbans = data.json;
        this.cadenceService.updateKanbanId(
          this.allUserKanbans[0].kanbanDefinitions[0].kanbanId
        );

        this.getKanbanDetails(
          this.allUserKanbans[0].kanbanDefinitions[0].kanbanId
        );
      },
    });
  }

  private getKanbanDetails(kanbanId: number): void {
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: kanbanId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        let details: IKanbanDetails = data.json[0];
        details.kanbanStages.forEach((stage) => {
          if (stage.StageOrganizations) {
            stage.StageOrganizations.forEach((org) => {
              this.sideKanban.tenantOrganizations.push({
                ...org,
                isOpen: false,
              });
            });
          }
        });
      },
    });
  }

  // Start Emily
  getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.userBuyboxes = data.json;
        this.userBuyboxes.forEach((buybox) => {
          this.GetOrgnizations(buybox);
        });
      },
    });
  }

  GetOrgnizations(buybox: IUserBuybox): void {
    const body: any = {
      Name: 'GetOrganizationsByBuyBox',
      MainEntity: null,
      Params: {
        BuyBoxId: buybox.id,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          buybox.IBuyboxOrganization = data.json;
        } else {
          buybox.IBuyboxOrganization = [];
        }
      },
    });
  }

  GetBuyBoxOrganizationsForEmail(
    buyboxId: number,
    organization: IBuyboxOrganization,
    isOpen: boolean
  ): void {
    const body: any = {
      Name: 'GetShoppingCenterManagerContacts',
      MainEntity: null,
      Params: {
        buyboxid: buyboxId,
        organizationid: organization.id,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.BuyBoxContacts = data.json[0].Contact;
          organization.contacts = data.json[0].Contact;
          organization.contacts = organization.contacts.filter(
            (c) => c.Centers
          );
          if (!isOpen) {
            organization.contacts.forEach((contact) => {
              contact.checked = true;
              contact.Centers.forEach((center) => {
                center.checked = true;
              });
            });
          }
        } else {
          this.BuyBoxContacts = [];
        }
      },
    });
  }

  getAllOrgData(buybox: IUserBuybox, buyboxOpen: boolean): void {
    buybox.IBuyboxOrganization.forEach((org) => {
      this.GetBuyBoxOrganizationsForEmail(buybox.id, org, buyboxOpen);
    });
  }

  checkBuybox(event: any, buybox: IUserBuybox) {
    const value = event.target.checked;
    this.userBuyboxes.forEach((bb) => {
      if (bb.id != buybox.id) {
        bb.checked = false;
        if (bb.IBuyboxOrganization) {
          bb.IBuyboxOrganization.forEach((org) => {
            org.checked = false;
            org.contacts?.forEach((contact) => {
              contact.checked = false;
              contact.Centers?.forEach((center) => {
                center.checked = false;
              });
            });
          });
        }
      } else {
        buybox.checked = value;
        if (buybox.checked) {
          buybox.IBuyboxOrganization.forEach((org) => {
            org.checked = value;
            org.contacts?.forEach((contact) => {
              contact.checked = value;
              contact.Centers?.forEach((center) => {
                center.checked = value;
              });
            });
            //this.GetBuyBoxOrganizationsForEmail(buybox.id, org);
          });
        } else {
          buybox.IBuyboxOrganization.forEach((org) => {
            org.checked = value;
            org.contacts?.forEach((contact) => {
              contact.checked = value;
              contact.Centers?.forEach((center) => {
                center.checked = value;
              });
            });
          });
        }
      }
    });
  }

  checkContacts(event: any, contacts: IBuyBoxContact[]) {
    const value = event.target.checked;
    contacts.forEach((contact) => {
      contact.checked = value;
      contact.Centers?.forEach((center) => {
        center.checked = value;
      });
    });
  }

  checkShoppingCenter(event: any, contact: IBuyBoxContact) {
    let value = event.target.checked;
    contact.checked = value;
  }

  updateCheckList() {
    let checkList: buyboxChecklist = {
      buyboxId: [],
      organizations: [],
    };

    this.userBuyboxes.forEach((buybox) => {
      // Add checked buybox IDs
      if (buybox.checked) {
        checkList.buyboxId.push(buybox.id);
      }

      // Handle organizations
      let orgCheckedList: OrganizationChecked[] = [];

      buybox.IBuyboxOrganization?.forEach((org) => {
        if (org.checked) {
          let contactsCheckedList: ContactsChecked[] = [];

          // Handle contacts (assuming you have IBuyboxContacts array inside org)
          org.contacts?.forEach((contact) => {
            if (contact.checked) {
              // Handle shoppingCenterIds (assuming you have IShoppingCenters array inside contact)
              let shoppingCenterCheckedIds: number[] = [];

              contact.Centers.forEach((sc) => {
                if (sc.checked) {
                  shoppingCenterCheckedIds.push(sc.id);
                }
              });

              // Add contact

              contactsCheckedList.push({
                id: contact.id,
                shoppingCenterId: shoppingCenterCheckedIds,
              });
            }
          });

          orgCheckedList.push({
            id: org.id,
            contacts: contactsCheckedList,
          });
        }
      });

      // Combine organizations
      if (orgCheckedList.length > 0) {
        checkList.organizations.push(...orgCheckedList);
      }
    });

    this.EmilyService.updateCheckList(checkList);

    // console.log(checkList);
  }

  // End Emily
}
