import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { PlacesService } from 'src/app/core/services/places.service';
import { Subject, merge } from 'rxjs';
import { takeUntil, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-ai-ui-HTML',
  templateUrl: './ai-ui-HTML.component.html',
  styleUrls: ['./ai-ui-HTML.component.css'],
})
export class AiUiHTMLComponent implements OnInit, OnDestroy {
  notificationId!: number;
  JSONByNotId: any;
  isLoading = false;
  isUploading = false;
  uploadProgress = 0;
  apiResponse: string = '';
  error: string = '';

  private destroy$ = new Subject<void>();
  private cancel$ = new Subject<void>(); // cancels in-flight calls on id change

  prompt: string = 
  `
  Role
You are a senior front-end engineer. Given a JSON object describing a retail center and its availabilities, produce a single, self-contained HTML + CSS snippet that renders an accessible, responsive "Center Overview" card with an availability table.
Input
A JSON object with keys like:
centerName, centerType, centerAddress, centerCity, centerState, centerCounty, zipCode, landArea_SF, percentLeased, smallestSpaceAvailable, totalAvailableSpace_SF, numberOfStores, mainImage, images, pdfUrl, class, Source, contacts (array), Availability (array of { buildingSizeSf, forLeasePrice, leaseType, suite, secondaryType }), tenants (array). (Example in user file.) 
Output requirements
Return only one <section> root containing semantic HTML and a <style> block scoped to this component.
No external libraries, no JavaScript, and no inline styles.
Responsive: mobile-first, fluid layout; availability table should horizontally scroll on small screens.
Accessible:
Provide meaningful alt for images; if URL missing, render a solid placeholder with the center's initials.
Use proper landmarks (<section>, <header>, <figure>, <table> with <caption>, <thead>, <tbody>).
Sufficient color contrast; focus-visible states for links.
Robustness: Gracefully handle missing/zero/empty fields with sensible fallbacks (e.g., show "N/A").
Units/formatting:
Use thousands separators for numbers (e.g., 2,928).
Append SF for square footage fields.
For forLeasePrice: 0 or missing → display "On Request" if leaseType is "On Request", else "Contact".
Links: If pdfUrl exists, render a "Download Brochure" link with rel="noopener", target="_blank".
Bad data: Never crash or show raw null, undefined, or empty strings—use "N/A".
CSS scope: Prefix all classes with center-card- to avoid collisions.
Layout & mapping
Header area:
Image (mainImage) to the left/top; if missing, render placeholder with initials from centerName.
Title: centerName
Subtitle: centerType • class (e.g., "Shopping Center • Class C")
Address line: centerAddress, centerCity, centerState (omit empty parts; auto-comma between present parts)
Quick stats (inline list or definition list):
Percent leased → percentLeased% (if 0 or missing, show "N/A")
Smallest space available → smallestSpaceAvailable SF (or "N/A")
Total available space → totalAvailableSpace_SF SF (or "N/A")
Land area → landArea_SF SF (or "N/A")
Number of stores → numberOfStores (or "N/A")
Availability table (render only if Availability has items):
Columns: Suite, Size (SF), Lease Type, Pricing, Secondary Type
Row mapping: suite (fallback "—"), buildingSizeSf, leaseType, forLeasePrice (format $X / NNN only if nonzero; otherwise "On Request"/"Contact"), secondaryType
Caption: "Current Availabilities"
Contacts (optional): If contacts non-empty, show a simple list: name, title, phone, email as links (if present).
Footer actions:
If pdfUrl present → button-styled anchor: "Download Brochure".
If Source present → small print: "Source: …".
Styles (guidelines)
Card: light surface, subtle shadow, 12 to 16px padding on mobile, 20 to 24px on larger screens; max-width: 1100px; border-radius: 8px.
Typography: system UI stack; 16px base; 1.5 line-height.
Colors: neutral grayscale with a single accent for headings/links; ensure WCAG AA contrast.
Table: zebra stripes, sticky header on wide viewports, overflow-x: auto wrapper on small screens.
Media: image uses object-fit: cover; aspect-ratio: 16/9;.
Edge cases
Empty arrays: omit the entire section (e.g., no Availability → hide table).
Zero/falsey numerics meant as unknown: show "N/A" unless clearly meaningful.
Broken image URL: use placeholder.
Missing location parts: render only the existing ones (no dangling commas).
Deliverable format
Return exactly one code block containing the HTML with an embedded <style> block followed by the component markup. No explanations outside the code block.
`;

  constructor(
    public activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.activatedRoute.params
      .pipe(
        map((p) => +p['notificationId']),
        distinctUntilChanged(), // only react to real id changes
        takeUntil(this.destroy$)
      )
      .subscribe((id) => {
        this.cancel$.next(); // 🔴 abort previous HTTP(s)
        this.resetComponent();
        this.notificationId = id;
        this.GetJSONByNotId();
      });
  }

  ngOnDestroy() {
    this.cancel$.next(); // abort anything still running
    this.destroy$.next();
    this.destroy$.complete();
    this.cancel$.complete();
  }

  private resetComponent(): void {
    this.isLoading = false;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.apiResponse = '';
    this.error = '';
    this.JSONByNotId = null;
  }

  GetJSONByNotId(): void {
    this.isLoading = true;
    this.error = '';
    this.apiResponse = '';

    const body: any = {
      Name: 'GetJSONByNotId',
      Params: {
        Id: this.notificationId,
      },
    };

    this.PlacesService.GenericAPI(body)
      .pipe(takeUntil(merge(this.destroy$, this.cancel$))) // 👈 abort on id change or destroy
      .subscribe({
        next: (data) => {
          this.JSONByNotId = data;
          this.isLoading = false;

          // Automatically generate HTML after getting JSON data
          this.sendToAI();
        },
        error: (error) => {
          console.error('Error fetching JSON:', error);
          this.error = 'Failed to load data';
          this.isLoading = false;
        },
      });
  }

  sendToAI(): void {
    if (!this.JSONByNotId?.json?.[0]?.json) {
      this.error = 'No JSON data available to send';
      return;
    }

    const formData = new FormData();
    formData.append(
      'Prompt',
      `${this.prompt}\n\nJSON Data:\n${this.JSONByNotId.json[0].json}`
    );

    this.error = '';
    this.apiResponse = '';
    this.isUploading = true;
    this.uploadProgress = 0;

    this.http
      .post(`https://emily.app/api/BrokerWithChatGPT/TestPrompt`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        takeUntil(merge(this.destroy$, this.cancel$)) // 👈 abort on id change or destroy
      )
      .subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(
              (100 * event.loaded) / (event.total || 1)
            );
          } else if (event.type === HttpEventType.Response) {
            this.handleApiResponse(event.body);
            this.isUploading = false;
            this.uploadProgress = 0;
          }
        },
        error: (err) => {
          this.handleApiError(err);
          this.isUploading = false;
          this.uploadProgress = 0;
        },
      });
  }

  private handleApiResponse(response: any): void {
    console.log('AI API Response:', response);
    this.apiResponse =
      response?.response || response?.message || JSON.stringify(response);
  }

  private handleApiError(error: any): void {
    console.error('AI API Error:', error);
    this.error =
      error?.error?.message ||
      error?.message ||
      'Failed to generate AI response';
  }

  async regenerateHTML(): Promise<void> {
    this.sendToAI();
  }

  retryLoad(): void {
    this.GetJSONByNotId();
  }
}
