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
  BuyBoxId!: any;
  OrgId!: any;
  BuyBoxName: string = '';
  ContactId!: any;
  currentView: any;
  buyboxCategories: BuyboxCategory[] = [];
  navbarOpen: any;
  savedMapView: any;
  map: any;
  dropdowmOptions: any = [
    // {
    //   text: 'Map',
    //   icon: '../../../assets/Images/Icons/map.png',
    //   status: 1,
    // },
    // {
    //   text: 'Side',
    //   icon: '../../../assets/Images/Icons/element-3.png',
    //   status: 2,
    // },
    // {
    //   text: 'Cards',
    //   icon: '../../../assets/Images/Icons/grid-1.png',
    //   status: 3,
    // },
    {
      text: 'Table',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    // {
    //   text: 'Social',
    //   icon: '../../../assets/Images/Icons/globe-solid.svg',
    //   status: 5,
    // },
  ];
  selectedOption!: number;
  isMobileView!: boolean;
  @ViewChild('ShareWithContact', { static: true }) ShareWithContact: any;
  Guid!: string;
  GuidLink!: string;
  campaignId!: any;
  loginSharedToken  !: any;
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
      
      this.BuyBoxId = params.buyBoxId;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      this.campaignId = params.campaignId;
    
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      localStorage.setItem('CampaignId', this.campaignId);
    
      this.ContactId = localStorage.getItem('contactId');
      this.loginSharedToken = localStorage.getItem('loginToken');
    });
    

    this.currentView = this.isMobileView ? '4' : '4';

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === parseInt(this.currentView)
    );
    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
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
        OrganizationId: + this.OrgId,
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
  @ViewChild('contentToDownload', { static: false }) contentToDownload!: ElementRef;
  
  // Get a human-readable name for the current view (for the PDF filename)
  getViewName(): string {
    switch (this.currentView) {
      case 1: return 'Map-View';
      case 2: return 'Side-View';
      case 3: return 'Cards-View';
      case 4: return 'Table-View';
      case 5: return 'Social-Media-View';
      default: return 'Market-View';
    }
  }
  
private async toDataURL(src: string): Promise<string> {
  // helper that actually does fetch+FileReader
  const fetchAndConvert = async (url: string) => {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`bad status: ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>(resolve => {
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
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(src);
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
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(imgs.map(async img => {
      try {
        // only convert if it looks like an external URL
        if (/^https?:\/\//.test(img.src) && !img.src.startsWith(window.location.origin)) {
          img.src = await this.toDataURL(img.src);
        }
      } catch (err) {
        console.warn('Could not embed image, skipping:', img.src, err);
      }
    }));

    // 2) Figure out view mode
    const isTable = this.currentView === 4;
    const isCard  = this.currentView === 3;
    const filename = `${this.getViewName()}-${Date.now()}.pdf`;

    // 3) html2canvas settings
    const h2cOpts: any = {
      scale:     isTable ? 1 : 2,
      useCORS:   true,
      allowTaint:false
    };

    // 4) jsPDF settings
    let jsPDFOpts: any;
    if (isTable) {
      jsPDFOpts = { unit:'pt', format:'a4', orientation:'landscape' };
    } else if (isCard) {
      // measure full container
      const w = container.scrollWidth;
      const h = container.scrollHeight;
      h2cOpts.width        = w;
      h2cOpts.height       = h;
      h2cOpts.windowWidth  = w;
      h2cOpts.windowHeight = h;
      jsPDFOpts = {
        unit:'px',
        format:[w, h],
        orientation:'portrait',
        hotfixes:['px_scaling']
      };
    } else {
      // fallback
      jsPDFOpts = { unit:'pt', format:'a4', orientation:'landscape' };
    }

    // 5) Generate PDF
    await html2pdf()
      .from(container)
      .set({
        filename,
        margin:      isTable ? 10 : 15,
        image:       { type:'jpeg', quality:1 },
        html2canvas: h2cOpts,
        jsPDF:       jsPDFOpts,
        pagebreak:   { mode:['css','legacy'] }
      })
      .save();

    this.spinner.hide();
  }

  async downloadCSV(): Promise<void> {
    this.spinner.show();
    
    try {
      // Different handling based on view type
      let csvContent: string = '';
      const fileName = `${this.getViewName()}-${Date.now()}.csv`;
      
      if (this.currentView === 4) { // Table view
        // Assume data is in a table format
        const table = this.contentToDownload.nativeElement.querySelector('table');
        if (!table) {
          throw new Error('No table found for CSV export');
        }
        
        // Extract headers
        const headers = Array.from(table.querySelectorAll('thead th'))
          .map(th => this.escapeCSVField((th as HTMLElement).innerText));
        
        csvContent += headers.join(',') + '\n';
        
        // Extract rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row:any) => {
          const rowData = Array.from(row.querySelectorAll('td'))
            .map(td => this.escapeCSVField((td as HTMLElement).innerText));
          csvContent += rowData.join(',') + '\n';
        });
      } else if (this.currentView === 3) { // Card view
        // For card view, we need to determine what data to extract
        // This depends on your specific card structure
        const cards = this.contentToDownload.nativeElement.querySelectorAll('.card');
        
        if (cards && cards.length > 0) {
          // Determine headers based on first card's data attributes
          // This is just an example - adjust to your actual card structure
          const firstCard = cards[0];
          const headerElements = firstCard.querySelectorAll('[data-field]');
          const headers = Array.from(headerElements)
            .map(el => this.escapeCSVField((el as HTMLElement).getAttribute('data-field') || ''));
          
          csvContent += headers.join(',') + '\n';
          
          // Extract data from all cards
          cards.forEach((card:any) => {
            const rowData = Array.from(card.querySelectorAll('[data-field]'))
              .map(el => this.escapeCSVField((el as HTMLElement).innerText));
            csvContent += rowData.join(',') + '\n';
          });
        } else {
          // Fallback if no cards with the expected structure are found
          // You might need a different approach based on your actual data structure
          throw new Error('No suitable data found for CSV export in card view');
        }
      } else {
        throw new Error('Current view does not support CSV export');
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
      // Optionally show an error message to the user
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
  private extractDataFromElement(element: HTMLElement, selector: string, attribute?: string): string {
    const el = element.querySelector(selector);
    if (!el) return '';
    
    if (attribute) {
      return el.getAttribute(attribute) || '';
    }
    return (el as HTMLElement).innerText;
  }
}
