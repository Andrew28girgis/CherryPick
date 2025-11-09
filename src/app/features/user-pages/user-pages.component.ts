import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface UserPage {
  title: string;
  createdDate: string;
  html: any;
}

// type ViewMode = "table" | "cards" | "timeline" | "list"
type ViewMode = 'cards' | 'list';

@Component({
  selector: 'app-user-pages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-pages.component.html',
  styleUrls: ['./user-pages.component.css'],
})
export class UserPagesComponent implements OnInit {
  userPages: UserPage[] = [];
  loading = false;
  error: string | null = null;
  currentView: ViewMode = 'cards';
  @ViewChild('HtmlModal', { static: true }) HtmlModal!: TemplateRef<any>;
  modalRef: any;
  htmlContent: SafeHtml | null = null;
  constructor(
    private placeService: PlacesService,
    private refreshService: RefreshService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // this.loadFakeData();
    this.getUserPages();
    this.refreshService.refreshUserPages$.subscribe(() => {
      this.getUserPages();
    });
  }

  switchView(view: ViewMode): void {
    this.currentView = view;
  }

  loadFakeData(): void {
 
    this.loading = false;
  }

  getUserPages(): void {
    this.loading = true;
    this.error = null;

    const body: any = {
      Name: 'GetUserPages',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res) => {
        this.userPages = res.json;
        console.log(this.userPages);

        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load user pages. Please try again.';
        this.loading = false;
      },
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  retry(): void {
    this.getUserPages();
  }
  view(rawHtml: string): void {
    // Extract <style> content
    const styleMatch = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    let scopedHtml = rawHtml;

    if (styleMatch) {
      const originalStyle = styleMatch[1];

      // Scope all selectors to .preview-wrapper
      const scopedStyle = originalStyle
        .split('}')
        .map((rule) => {
          const [selectors, body] = rule.split('{');
          if (!selectors || !body) return '';
          return `.preview-wrapper ${selectors.trim()} {${body}}`;
        })
        .join(' ');

      // Replace <style> in HTML with the new scoped one
      scopedHtml = rawHtml.replace(
        styleMatch[0],
        `<style>${scopedStyle}</style>`
      );
    }

    // Now sanitize the modified HTML
    this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(scopedHtml);

    this.modalRef = this.modalService.open(this.HtmlModal, {
      size: 'lg',
      scrollable: true,
    });
  }
}
