import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SidebarService } from './sidebar.service'; // Create this service
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isInactive = false;
  @Output() collapseChange = new EventEmitter<boolean>();

  sidebarItems: any[];
  collapse: boolean;
  activeItem: string | null = null;
  private destroy$ = new Subject<void>();
  isDarkTheme$ = this.themeService.isDarkTheme$;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sidebarService: SidebarService,
    private themeService: ThemeService // Add this
  ) {
    this.sidebarItems = [
      { title: 'Dashboard', icon: 'element-4', link: '/Kanban' },
      // { title: 'StakeHolders', icon: 'people', link: '/stake-holders' },
      // { title: 'Properties', icon: 'building', link: '/Properties' },
      // { title: 'Tasks', icon: 'task-square', link: '/tasks' },
      // { title: 'Sources', icon: 'global', link: '/Sources' },
      // { title: 'Archive', icon: 'folder-open', link: '/archive' },
      // { title: 'Assistant', icon: 'magic-star', link: '/assistant' },
      // { title: 'Permissions', icon: 'setting', link: '/permissions' },
    ];
    this.collapse = this.sidebarService.getCollapsedState();
  }

  ngOnInit() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateActiveItem();
    });
    this.themeService.initializeTheme();

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeCollapse(): void {
    this.collapse = !this.collapse;
    this.sidebarService.setCollapsedState(this.collapse);
    this.collapseChange.emit(this.collapse);
  }

  isLinkActive(link: string): boolean {
    if (link === '/Kanban') {
      return this.router.url === '/Kanban' || this.router.url === '/Done';
    }
    if (link === '/Properties') {
      return this.router.url === '/Properties' || this.router.url === '/PropertiesSpilit' || this.router.url === '/PropertiesGrid';
    }
    return this.router.isActive(link, true);
  }

  onSidebarItemClick(item: any): void {
    this.activeItem = item.title;
    this.router.navigate([item.link]);
  }

  private updateActiveItem(): void {
    const activeItem = this.sidebarItems.find((item) => this.isLinkActive(item.link));
    if (activeItem) {
      this.activeItem = activeItem.title;
    }
  }
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

