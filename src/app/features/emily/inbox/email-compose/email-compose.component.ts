import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { ActivatedRoute } from '@angular/router';
import { ICenterData } from 'src/app/features/kayak-home/shopping-center-table/contact-broker/models/icenter-data';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-email-compose',
  templateUrl: './email-compose.component.html',
  styleUrls: ['./email-compose.component.css'],
})
export class EmailComposeComponent implements OnInit {
  @Input() contactId!: number;
  @Input() buyBoxId!: number;
  @Input() orgId!: number;
  @Input() campaignId!: string | null;
  @Input() contactName!: string;

  currentStep = 1;
  emailSubject = '';
  emailBody = '';
  sanitizedEmailBody!: SafeHtml;
  showGenerateSection = false;
  listcenterName: string[] = [];
  GetShoppingCenters: ICenterData[] = [];
  ContextEmail = '';
  BatchGuid = crypto.randomUUID();
  localStorageContactId!: any;

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
  constructor(
    public modal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private places: PlacesService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(() => {
      this.localStorageContactId = localStorage.getItem('contactId');
    });
    this.loadShoppingCenters();
    await this.loadPrompts();
  }
  toggleAdvanced() {
    this.isAdvancedVisible = !this.isAdvancedVisible;
  }

  next() {
    this.currentStep++;
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
    });
  }

  private async loadPrompts() {
    // 1) get category
    const catResp = await firstValueFrom(
      this.places.GenericAPI({
        name: 'GetPromptsCategoryId',
        params: { Name: 'Availability' },
      })
    );
    const catId = catResp?.json?.[0]?.Id;
    if (!catId) return;

    // 2) get prompts
    const prResp = await firstValueFrom(
      this.places.GenericAPI({
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
    // default select first
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
    const dto: any = {
      ContactId: this.localStorageContactId,
      BuyBoxId: this.buyBoxId,
      CampaignId: this.campaignId ? +this.campaignId : 0,
      GetContactManagers: [
        {
          ContactId: this.contactId,
          ContactName: this.contactName,
          ShoppingCentersName: this.listcenterName,
        },
      ],
      OrganizationId: this.orgId,
      BatchGuid: this.BatchGuid,
    };
    // mix in each flag
    this.flagOptions.forEach((opt) => (dto[opt.key] = opt.checked));

    this.places.GenerateContext(dto as GenerateContextDTO).subscribe((res) => {
      this.ContextEmail = res.context.replace(/\n/g, '<br>');
      this.sanitizedEmailBody = this.sanitizer.bypassSecurityTrustHtml(
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
        BuyBoxId: this.buyBoxId,
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
        this.getGeneratedEmail(data.json[0].id);
      },
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
        if (!response || response.length === 0) {
          setTimeout(() => {
            this.getGeneratedEmail(id);
          }, 3000);
        } else {
          this.emailBody = response[0].body;
          this.sanitizedEmailBody = this.sanitizer.bypassSecurityTrustHtml(
            this.emailBody
          );
          this.emailSubject = response[0].subject;
          this.spinner.hide();
        }
      },
    });
  }

  send() {
    this.spinner.show();
    const body = {
      Name: 'ComposeEmail',
      Params: {
        BuyBoxId: this.buyBoxId,
        CampaignId: this.campaignId,
        RecieverId: this.contactId.toString(),
        Subject: this.emailSubject,
        Body: this.emailBody,
      },
    };
    this.places.GenericAPI(body).subscribe(() => {
      this.spinner.hide();
      this.modal.close('sent');
    });
  }

  public generateAndNext() {
    this.currentStep = 3;
    this.generateContext();
  }
}
