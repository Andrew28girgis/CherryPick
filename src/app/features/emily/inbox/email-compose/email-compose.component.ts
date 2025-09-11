import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { ActivatedRoute } from '@angular/router';
import { ICenterData } from 'src/app/features/kayak-home/shopping-center-table/contact-broker/models/icenter-data';
import { firstValueFrom } from 'rxjs';
import { IManager } from 'src/app/features/kayak-home/shopping-center-table/contact-broker/models/imanage-shopping';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-email-compose',
  templateUrl: './email-compose.component.html',
  styleUrls: ['./email-compose.component.css'],
})
export class EmailComposeComponent implements OnInit {
  @Input() contactId!: number;
  // @Input() buyBoxId!: number;
  @Input() orgId!: number;
  @Input() campaignId!: string | null;
  @Input() contactName!: string;
  @Input() email!: string;
  @Input() BBName!: string;
  @Input() BBId!: string;

  currentStep = 1;
  emailSubject = '';
  emailBody = '';
  sanitizedEmailBody!: SafeHtml;
  sanitizedEmailBodyContext!: SafeHtml;
  showGenerateSection = false;
  listcenterName: string[] = [];
  listcenteIds: number[] = [];
  listcenteIdsString: string = '';
  GetShoppingCenters: ICenterData[] = [];
  ContextEmail = '';
  BatchGuid = crypto.randomUUID();
  localStorageContactId!: any;
  mailContextId!: number;

  prompts: { id: number; name: string; promptText: string }[] = [];
  selectedPromptId!: number;
  flagOptions = [
    { key: 'AddMinMaxSize', label: 'Include Min/Max Size', checked: true },
    { key: 'AddCompetitors', label: 'Include Competitors', checked: true },
    { key: 'AddComplementaries', label: 'Include Complementaries', checked: true },
    { key: 'AddBuyBoxManageOrgDesc', label: 'Include Org Management Details', checked: true},
    { key: 'AddSpecificBuyBoxDesc', label: 'Include Specific Buy Box Details', checked: true },
    { key: 'AddBuyBoxDesc', label: 'Include General Buy Box Description', checked: true},
    { key: 'AddLandLordPage', label: 'Include Landlord Page Info', checked: true },
    { key: 'IsCC', label: 'CC', checked: true },
  ];
  isAdvancedVisible :boolean = false;
  GetManagersShoppingCenters: IManager[] = [];
  @ViewChild('sendModal') sendModal: any;
  CCEmail: any;
  mailId: any;
  constructor(
    public modal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private places: PlacesService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private modalService: NgbModal,
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(() => {
      this.localStorageContactId = localStorage.getItem('contactId');
    });
    this.loadShoppingCenters();
    await this.loadPrompts();
    this.GetCCEmail();
  }

  toggleAdvanced() {
    this.isAdvancedVisible = !this.isAdvancedVisible;
  }

  next() {
    if (this.currentStep === 1) {
      this.onStepChange(); // Check if there are managers when moving from Step 1 to Step 2
    } else if (this.currentStep === 2) {
      this.checkManagersAndSwitchToNextStep(); // Check if there are managers when moving from Step 2
    } else if (this.currentStep === 3) {
      this.currentStep = 3; // Ensure it stays on step 3 if already on it
    }
  }
  onStepChange() {
    // This logic is now for moving from Step 1 to Step 2
    const hasManagers = this.GetShoppingCenters.some(
      (sc) => sc.Managers && sc.Managers.length > 0
    );
    if (!hasManagers) {
      // If no managers are found, go to step 3
      this.currentStep = 3;
    } else {
      // Otherwise, go to step 2
      this.currentStep = 2;
    }
  }
  checkManagersAndSwitchToNextStep() {
    // This logic is for moving from Step 2 to Step 3, checking if managers are selected
    const selectedManagers = this.GetShoppingCenters.some(
      (sc) => sc.Managers && sc.Managers.some((mgr) => mgr.selected)
    );
    if (!selectedManagers) {
      // If no managers are selected, go to step 3
      this.currentStep = 3;
    } else {
      // If there are selected managers, proceed to next step
      this.currentStep = 3;
    }
  }
  previous() {
    this.currentStep--;
  }

  loadShoppingCenters() {
    const body = {
      Name: 'GetShoppingCentersForContact',
      Params: { ContactId: this.contactId, CampaignId: this.campaignId },
    };
    this.places.GenericAPI(body).subscribe((res) => {
      this.GetShoppingCenters = res.json;
      this.listcenterName = this.GetShoppingCenters.map((c) => c.CenterName);
      this.listcenteIds = this.GetShoppingCenters.map((c) => c.Id);
      this.listcenteIdsString = this.listcenteIds.join(','); // <-- convert array to comma-separated string

      this.fetchManagersForAllCenters();
    });
  }
  fetchManagersForAllCenters() {
    this.GetShoppingCenters.forEach(center => {
      const mgrBody = {
        Name: 'GetShoppingCenterManagers',
        Params: {
          ContactId: this.contactId,
          ShoppingCenterId: center.Id
        }
      };
      this.places.GenericAPI(mgrBody).subscribe(res => {
        const raw = res.json as IManager[];
        // Attach `selected` (default true) and the parent center name
        center.Managers = raw.map(m => ({
          ...m,
          selected: true,
          centerName: center.CenterName
        }));
      });
    });
  }
  onManagerCheckboxChange(
    mgr: IManager & { selected: boolean; centerName: string },
    event: Event
  ) {
    const input = event.target as HTMLInputElement;
    mgr.selected = input.checked;
  }

  private async loadPrompts() {    
    const catResp = await firstValueFrom(
      this.places.BetaGenericAPI({
        name: 'GetPromptsCategoryId',
        params: { Name: 'Availability' },
      })
    );
    const catId = catResp?.json?.[0]?.Id;
    if (!catId) return;

    const prResp = await firstValueFrom(
      this.places.BetaGenericAPI({
        name: 'GetPrompts',
        MainEntity: null,
        params: { Id: catId },
        Json: null,
      })
    );
    const data = prResp.json || [];
    this.prompts = data.map((p: any) => ({
      id: p.Id,
      name: p.Name,
      promptText: p.PromptText,
    }));
    
    if (this.prompts.length) {
      this.selectedPromptId = this.prompts[0].id;
    }
  }

  isCenterSelected(name: string): boolean {
    return this.listcenterName.includes(name);
  }

  onCenterCheckboxChange(name: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !this.listcenterName.includes(name)) {
      this.listcenterName.push(name);
    } else if (!checked) {
      this.listcenterName = this.listcenterName.filter((n) => n !== name);
    }
  }

  onContentChange(e: Event) {
    this.emailBody = (e.target as HTMLElement).innerText;
  }
  onFlagChange(opt: any, e: Event) {
    opt.checked = (e.target as HTMLInputElement).checked;
  }

  generateContext() {
    this.spinner.show();

  // 1) build a map from manager.id → { info + array of center names }
  const mgrMap = new Map<
    number,
    { ContactId: number; ContactName: string; ShoppingCentersName: string[] }
  >();

  this.GetShoppingCenters.forEach(sc => {
    (sc.Managers || []).forEach(mgr => {
      if (!mgr.selected) return;

      if (!mgrMap.has(mgr.contactId)) {
        mgrMap.set(mgr.contactId, {
          ContactId:   mgr.contactId,
          ContactName: `${mgr.firstname} ${mgr.lastname}`,
          ShoppingCentersName: []
        });
      }
      // push this center’s name into that manager’s array
      mgrMap.get(mgr.contactId)!.ShoppingCentersName.push(sc.CenterName);
    });
  });

  // 2) convert map → array
  const selectedManagers = Array.from(mgrMap.values());

  // 2.5) append this.contactID and this.contactName and the shopping center name
  if (this.contactId && this.contactName) {
    selectedManagers.push({
      ContactId: this.contactId,
      ContactName: this.contactName,
      ShoppingCentersName: this.listcenterName // or populate if applicable
    });
  }
  // 3) build your dto
    const dto: any = {
      ContactId: this.localStorageContactId,
      // BuyBoxId: this.buyBoxId,
      CampaignId: this.campaignId ? +this.campaignId : 0,
      GetContactManagers: selectedManagers,
      OrganizationId: this.orgId,
      BatchGuid: this.BatchGuid,
    };
    // mix in each flag
    this.flagOptions.forEach((opt) => (dto[opt.key] = opt.checked));

    this.places.GenerateContext(dto as GenerateContextDTO).subscribe((res) => {
      this.ContextEmail = res.context.replace(/\n/g, '<br>');
      this.sanitizedEmailBodyContext = this.sanitizer.bypassSecurityTrustHtml(
        this.ContextEmail
      );
      this.showGenerateSection = true;
      this.putDraft(res.context);
    });
  }

  private putDraft(context: string) {
    const contextBody = context.replace(/<br>/g, '\n');
    const body = {
      Name: 'PutMailsDraft',
      Params: {
        // BuyBoxId: this.buyBoxId,
        ContactId: this.localStorageContactId,
        PromptId: this.selectedPromptId,
        IsCC: true,
        OrganizationId: this.orgId,
        context: contextBody,
        BatchGuid: this.BatchGuid,
        CampaignId: this.campaignId,
      },
    };
    this.places.GenericAPI(body).subscribe({
      next: (data) => {
        this.mailContextId=data.json[0].id;
        // this.getGeneratedEmail(data.json[0].id);
        this.AddMailContextReceivers();
        this.CheckMailGenerated();
      },
    });
  }
   AddMailContextReceivers() {
    const body: any = {
      Name: 'AddMailContextReceivers',
      MainEntity: null,
      Params: {
        MailContextId: this.mailContextId,
        ContactId: this.contactId,
        ShoppingCenterIds: this.listcenteIdsString,
      },
      Json: null,
    };
    this.places.GenericAPI(body).subscribe(() => {
    });
  }
  GetCCEmail() {
    const body: any = {
      Name: 'GetCCEmail',
      MainEntity: null,
      Params: {},
      Json: null,
    };
    this.places.GenericAPI(body).subscribe((res) => {
      const CEmail = res.json[0].virtualEmail;
     this.CCEmail= CEmail;
     
    });
  }
  CheckMailGenerated() {
    const body: any = {
      Name: 'CheckMailGenerated',
      MainEntity: null,
      Params: {
        MailContextId: this.mailContextId,
      },
      Json: null,
    };
    this.places.GenericAPI(body).subscribe((res) => {
      const response = res.json[0];
      if (!response || response.length === 0) {
          this.CheckMailGenerated();
      } else {
      if (response.isGenerated) {
        this.getGeneratedEmail(this.mailContextId);
        this.spinner.hide();
        // this.getGeneratedEmail(this.mailContextId);
        return;
      } else if (response.errorMessage) {
        this.spinner.hide();
        alert(
          'Email generation is taking longer than expected. Please close this window and check your drafts folder in Emily later.'
        );
        this.modal.close('sent');
        return;
      }
      setTimeout(() => {
        this.CheckMailGenerated();
      }, 3000);
    }
    });
  }

  getGeneratedEmail(id: number): void {
    this.spinner.show();
    const body: any = {
      Name: 'ReadSpecificMails',
      MainEntity: null,
      Params: {
        MailContextId: Number(id),
        IsSent: 0,
      },
      Json: null,
    };

    this.places.GenericAPI(body).subscribe({
      next: (data) => {
        const response = data.json;
          this.emailBody = response[0].Body;
          this.sanitizedEmailBody = this.sanitizer.bypassSecurityTrustHtml(
            this.emailBody
          );
          this.emailSubject = response[0].Subject;
          this.mailId = response[0].MailId;
          this.spinner.hide();
      },
    });
  }

  // send() {
  //   this.spinner.show();
  //   const body = {
  //     Name: 'ComposeEmail',
  //     Params: {
  //       BuyBoxId: this.buyBoxId,
  //       CampaignId: this.campaignId,
  //       RecieverId: this.contactId.toString(),
  //       Subject: this.emailSubject,
  //       Body: this.emailBody,
  //     },
  //   };
  //   this.places.GenericAPI(body).subscribe(() => {
  //     this.spinner.hide();
  //     this.modal.close('sent');
  //     this.modalService.dismissAll();
  //   });
  // }
  UpdateEmailData(){
    this.spinner.show();
    const body = {
      Name: 'UpdateEmailData',
      MainEntity: null,
      Params: {
        MailId: this.mailId,
        Subject: this.emailSubject,
        Body: this.emailBody,
      },
      Json: null,
    };
    this.places.GenericAPI(body).subscribe(() => {
      this.spinner.hide();
      this.modal.close('sent');
      this.modalService.dismissAll();
    });
  }

  public generateAndNext() {
    this.currentStep = 3;
    this.generateContext();
  }
  openSendModal() {
    this.getSelectedManagerEmails();
    this.modalService.open(this.sendModal, { centered: true ,windowClass: 'email-mod'});
  }
  selectedManagerEmails: string = ''; // Added variable to store manager emails
  getSelectedManagerEmails() {
    const selectedEmails: string[] = [];  // Explicitly declare the type as an array of strings
    this.GetShoppingCenters.forEach(center => {
      (center.Managers || []).forEach(mgr => {
        if (mgr.selected) {
          selectedEmails.push(mgr.email); // Add email of selected manager
        }
      });
    });
    // Join the emails with a comma
    this.selectedManagerEmails = selectedEmails.join(',');
  }
  encodeBody(body: any): string {
    return encodeURIComponent(body)
      .replace(/%20/g, ' ') // Spaces are encoded as '%20' by default
      .replace(/\+/g, '%20'); // Replace '+' with '%20'
  }

  generateMailtoLink(): any {
    const toEmails = `${this.email},${this.CCEmail},${this.selectedManagerEmails}`;
    const subject = encodeURIComponent(this.emailSubject || '');
    const body = this.encodeBody(this.emailBody || '');
    const target = `https://outlook.office.com/mail/deeplink/compose?to=${toEmails}&subject=${subject}&body=${body}`;
 
    const redirectURL = new URL('https://outlook.office.com/owa/?state=1');
    redirectURL.searchParams.set(
      'redirectTo',
      btoa(target).replaceAll('=', '')
    );
    return redirectURL;
  }
}
