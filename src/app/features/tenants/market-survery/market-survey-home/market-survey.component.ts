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
    

    this.currentView = this.isMobileView ? '5' : '2';

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
  
  downloadPDF(): void {
    // We need to wait a moment to ensure all components are fully rendered
    setTimeout(() => {
      const element = this.contentToDownload.nativeElement;
      
      if (!element) {
        console.error('Element not found');
        return;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const options = {
        filename: `${this.getViewName()}-${timestamp}.pdf`,
        margin: 0,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: { 
          unit: 'px', 
          format: 'a0', 
          orientation: 'portrait', 
          hotfixes: ['px_scaling']
        }
      };
      
      // Show loading indicator (optional)
      // this.isGeneratingPDF = true;
      
      // Create and download the PDF
      html2pdf()
        .from(element)
        .set(options)
        .save()
        .then(() => {
          console.log('PDF downloaded successfully');
          // this.isGeneratingPDF = false;
        })
       
    }, 0); // Short delay to ensure rendering is complete
  }
}
