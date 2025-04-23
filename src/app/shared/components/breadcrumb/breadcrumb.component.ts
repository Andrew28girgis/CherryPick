import { Component, OnInit } from '@angular/core';
import {
  BreadcrumbService,
  BreadcrumbItem,
} from '../../../core/services/breadcrumb.service';
import {
  BreadcrumbService,
  BreadcrumbItem,
} from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbService.getBreadcrumbs().subscribe((breadcrumbs) => {
      setTimeout(() => {
        this.breadcrumbs = breadcrumbs;
      });
    });
  }
}
