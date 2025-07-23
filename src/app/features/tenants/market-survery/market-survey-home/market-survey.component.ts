import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { General } from 'src/app/shared/models/domain';
import { StateService } from 'src/app/core/services/state.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { MapsService } from 'src/app/core/services/maps.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-market-survey',
  templateUrl: './market-survey.component.html',
  styleUrls: ['./market-survey.component.css'],
})
export class MarketSurveyComponent implements OnInit {
  General!: General;
  // BuyBoxId!: any;
  OrgId!: any;
  // BuyBoxName: string = '';
  organizationName!:string
  ContactId!: any;
  currentView: any;
  buyboxCategories: BuyboxCategory[] = [];
  navbarOpen: any;
  savedMapView: any;
  map: any;
  dropdowmOptions: any = [
    {
      text: 'Map',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
    {
      text: 'Side',
      icon: '../../../assets/Images/Icons/element-3.png',
      status: 2,
    },
    {
      text: 'Cards',
      icon: '../../../assets/Images/Icons/grid-1.png',
      status: 3,
    },
    {
      text: 'Table',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    {
      text: 'Social',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
  ];
  selectedOption!: number;
  isMobileView!: boolean;
  @ViewChild('ShareWithContact', { static: true }) ShareWithContact: any;
  Guid!: string;
  GuidLink!: string;
  campaignId!: any;
  loginSharedToken!: any;
  constructor(
    public activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService,
    private stateService: StateService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private modalService: NgbModal
  ) {
    this.savedMapView = localStorage.getItem('mapView');
    this.isMobileView = window.innerWidth <= 768;
    this.markerService.clearMarkers();
  }

  ngOnInit() {
    this.General = new General();
    this.activatedRoute.queryParams.subscribe((params: any) => {
      // this.BuyBoxId = params.buyBoxId;
      this.OrgId = params.orgId;
      this.organizationName = params.name;
      this.campaignId = params.campaignId;

      // localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      localStorage.setItem('CampaignId', this.campaignId);

      this.ContactId = localStorage.getItem('contactId');
      this.loginSharedToken = localStorage.getItem('loginToken');
    });

    this.currentView = this.isMobileView ? '5' : '3';

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === parseInt(this.currentView)
    );
    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
  }
    goBack(): void {
    window.history.back();
  }

  getNeareastCategoryName(categoryId: number) {
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }
  onCheckboxChange(category: BuyboxCategory): void {
    this.markerService.toggleMarkers(this.map, category);
  }

  toggleNavbar() {
    this.navbarOpen = !this.navbarOpen;
  }
  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    localStorage.setItem('currentView', this.currentView);
  }
  OpenShareWithContactModal(content: any): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxGUID',
      Params: {
        CampaignId: +this.campaignId,
        OrganizationId: +this.OrgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Guid = data.json[0].buyBoxLink;
        if (this.Guid) {
          this.GuidLink = `https://cp.cherrypick.com/?t=${this.Guid}`;
          // this.GuidLink = `http://localhost:4200/?t=${this.Guid}`;
        } else {
          this.GuidLink = '';
        }
        this.spinner.hide();
      },
    });
    this.modalService.open(this.ShareWithContact, { size: 'lg' });
  }

  copyGUID(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        this.showToast('Tenant Link Copied to Clipboard!');
        this.modalService.dismissAll();
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
  @ViewChild('contentToDownload', { static: false })
  contentToDownload!: ElementRef;

  // Get a human-readable name for the current view (for the PDF filename)
  getViewName(): string {
    switch (this.currentView) {
      case 1:
        return 'Map-View';
      case 2:
        return 'Side-View';
      case 3:
        return 'Cards-View';
      case 4:
        return 'Table-View';
      case 5:
        return 'Social-Media-View';
      default:
        return 'Market-View';
    }
  }

  private async toDataURL(src: string): Promise<string> {
    // helper that actually does fetch+FileReader
    const fetchAndConvert = async (url: string) => {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`bad status: ${res.status}`);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };

    try {
      // first attempt: direct fetch
      return await fetchAndConvert(src);
    } catch (err) {
      console.warn('Direct fetch failed, retrying via CORS proxy:', src, err);
      // fallback to public CORS proxy
      const proxyUrl =
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(src);
      return await fetchAndConvert(proxyUrl);
    }
  }

  /**
   * Unified PDF download method. Tables → paginated A4-Landscape.
   * Cards → one tall single page, all images embedded via data-URLs.
   */
  async downloadPDF(): Promise<void> {
    this.spinner.show();
    const container = this.contentToDownload.nativeElement as HTMLElement;
    if (!container) {
      console.error('No container found for PDF export');
      this.spinner.hide();
      return;
    }

    // 1) Embed ALL <img> as data-URLs if they’re cross-origin
    const imgs = Array.from(
      container.querySelectorAll('img')
    ) as HTMLImageElement[];
    await Promise.all(
      imgs.map(async (img) => {
        try {
          // only convert if it looks like an external URL
          if (
            /^https?:\/\//.test(img.src) &&
            !img.src.startsWith(window.location.origin)
          ) {
            img.src = await this.toDataURL(img.src);
          }
        } catch (err) {
          console.warn('Could not embed image, skipping:', img.src, err);
        }
      })
    );

    // 2) Figure out view mode
    const isTable = this.currentView === 4;
    const isCard = this.currentView === 3;
    const filename = `${this.getViewName()}-${Date.now()}.pdf`;

    // 3) html2canvas settings
    const h2cOpts: any = {
      scale: isTable ? 1 : 2,
      useCORS: true,
      allowTaint: false,
    };

    // 4) jsPDF settings
    let jsPDFOpts: any;
    if (isTable) {
      jsPDFOpts = { unit: 'pt', format: 'a4', orientation: 'landscape' };
    } else if (isCard) {
      // measure full container
      const w = container.scrollWidth;
      const h = container.scrollHeight;
      h2cOpts.width = w;
      h2cOpts.height = h;
      h2cOpts.windowWidth = w;
      h2cOpts.windowHeight = h;
      jsPDFOpts = {
        unit: 'px',
        format: [w, h],
        orientation: 'portrait',
        hotfixes: ['px_scaling'],
      };
    } else {
      // fallback
      jsPDFOpts = { unit: 'pt', format: 'a4', orientation: 'landscape' };
    }

    // 5) Generate PDF
    await html2pdf()
      .from(container)
      .set({
        filename,
        margin: isTable ? 10 : 15,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: h2cOpts,
        jsPDF: jsPDFOpts,
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .save();

    this.spinner.hide();
  }

  // Add this method to your component class
  async downloadCSV(): Promise<void> {
    this.spinner.show();

    try {
      let csvContent: string = '';
      const fileName = `${this.getViewName() || 'export'}-${Date.now()}.csv`;

      // Try to find a table first - this works for any view that contains a table
      const table = this.contentToDownload.nativeElement.querySelector('table');

      if (table) {
        // Table found - extract data from it
        // Extract headers
        const headers = Array.from(table.querySelectorAll('thead th')).map(
          (th) => this.escapeCSVField((th as HTMLElement).innerText.trim())
        );

        if (headers.length > 0) {
          csvContent += headers.join(',') + '\n';
        }

        // Extract rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row: HTMLTableRowElement) => {
          const rowData = Array.from(row.querySelectorAll('td')).map((td) =>
            this.escapeCSVField((td as HTMLElement).innerText.trim())
          );
          csvContent += rowData.join(',') + '\n';
        });
      } else if (this.currentView === 3) {
        // Card view handling
        const cards =
          this.contentToDownload.nativeElement.querySelectorAll('.card');

        if (cards && cards.length > 0) {
          // This is a generic approach - adjust according to your card structure
          // Try to extract key-value pairs from cards
          const keyValuePairs = new Map<string, string[]>();

          // First pass: collect all possible keys
          cards.forEach((card: any) => {
            const labelElements = card.querySelectorAll(
              '.label, .field-label, [data-field]'
            );
            labelElements.forEach((label: any) => {
              const key = (label as HTMLElement).innerText
                .trim()
                .replace(':', '');
              if (!keyValuePairs.has(key)) {
                keyValuePairs.set(key, []);
              }
            });
          });

          // Set up headers
          const headers = Array.from(keyValuePairs.keys());
          csvContent +=
            headers.map((h) => this.escapeCSVField(h)).join(',') + '\n';

          // Second pass: extract values for each card
          cards.forEach((card: HTMLElement) => {
            const rowData = new Array(headers.length).fill(''); // Initialize with empty values

            headers.forEach((header, index) => {
              // Try different selector strategies
              const labelElement = Array.from(
                card.querySelectorAll('.label, .field-label, [data-field]')
              ).find(
                (el) =>
                  (el as HTMLElement).innerText.trim().replace(':', '') ===
                  header
              );

              if (labelElement) {
                // Try to find the value in the next sibling or parent container
                let value = '';

                // Strategy 1: Next element sibling
                const nextSibling = labelElement.nextElementSibling;
                if (nextSibling) {
                  value = (nextSibling as HTMLElement).innerText.trim();
                }

                // Strategy 2: Parent's text excluding the label text
                if (!value) {
                  const parent = labelElement.parentElement;
                  if (parent) {
                    const parentText = (parent as HTMLElement).innerText.trim();
                    const labelText = (
                      labelElement as HTMLElement
                    ).innerText.trim();
                    if (parentText.includes(labelText)) {
                      value = parentText
                        .substring(
                          parentText.indexOf(labelText) + labelText.length
                        )
                        .trim();
                    }
                  }
                }

                // Strategy 3: Look for associated value element
                if (!value) {
                  const valueElement = card.querySelector(
                    `[data-value="${header}"], .value-${header}`
                  );
                  if (valueElement) {
                    value = (valueElement as HTMLElement).innerText.trim();
                  }
                }

                if (value) {
                  rowData[index] = value;
                }
              }
            });

            csvContent +=
              rowData.map((v) => this.escapeCSVField(v)).join(',') + '\n';
          });
        }
      } else {
        // Generic approach for any other view:
        // Extract all text content in a structured way
        const content = this.contentToDownload.nativeElement;

        // Try to find data in lists (ul/ol)
        const lists = content.querySelectorAll('ul, ol');
        if (lists && lists.length > 0) {
          // Extract list items
          lists.forEach((list: Element) => {
            const items = list.querySelectorAll('li');
            items.forEach((item) => {
              csvContent +=
                this.escapeCSVField((item as HTMLElement).innerText.trim()) +
                '\n';
            });
            csvContent += '\n'; // Add empty line between lists
          });
        } else {
          // If no lists found, extract from paragraphs or other text elements
          const textElements = content.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, div:not(:has(*))'
          );
          textElements.forEach((element: HTMLElement) => {
            const text = (element as HTMLElement).innerText.trim();
            if (text) {
              csvContent += this.escapeCSVField(text) + '\n';
            }
          });
        }

        // If still no content, just grab all text
        if (!csvContent) {
          csvContent = this.escapeCSVField(content.innerText.trim());
        }
      }

      // If we still don't have content, inform the user
      if (!csvContent.trim()) {
        throw new Error('No exportable data found');
      }

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      // Show error to user
    } finally {
      this.spinner.hide();
    }
  }

  // Helper method to properly escape CSV fields
  private escapeCSVField(field: string): string {
    // If the field contains commas, newlines, or double quotes, enclose in double quotes
    // Also escape any double quotes by doubling them
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  // Optional: Add method to extract specific data from custom elements
  private extractDataFromElement(
    element: HTMLElement,
    selector: string,
    attribute?: string
  ): string {
    const el = element.querySelector(selector);
    if (!el) return '';

    if (attribute) {
      return el.getAttribute(attribute) || '';
    }
    return (el as HTMLElement).innerText;
  }
}
