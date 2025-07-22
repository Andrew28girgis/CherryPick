import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './automation.component.html',
  styleUrl: './automation.component.css',
})
export class AutomationComponent implements OnInit {
  automationId!: number;
  automationResponses: any[] = []; // Changed to array to hold multiple responses
  tableColumns: string[] = [];
  shoppingCenterId!: number; // Added to hold shopping center ID

  constructor(
    public activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const id = params['automationId'];
      this.automationId = id;
    });
    this.GetAutomationResponseForShoppingCenter();
  }

  GetAutomationResponseForShoppingCenter(): void {
    const body: any = {
      Name: 'GetAutomationResponseForShoppingCenter',
      Params: {
        Id: this.automationId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenterId = data.json[0].shoppingCenterId;

        this.automationResponses = [];
        const columnSet = new Set<string>();

        data.json.forEach((item: any, responseIndex: number) => {
          let parsedJsonResponse = null;

          // Parse JSON string to object/array
          if (
            item.automationJsonResponse &&
            typeof item.automationJsonResponse === 'string'
          ) {
            try {
              parsedJsonResponse = JSON.parse(item.automationJsonResponse);
            } catch (error) {
              console.error('Error parsing JSON response:', error);
              parsedJsonResponse = null;
            }
          } else {
            parsedJsonResponse = item.automationJsonResponse;
          }

          if (Array.isArray(parsedJsonResponse)) {
            parsedJsonResponse.forEach((contact: any, contactIndex: number) => {
              this.automationResponses.push({
                textResponse: item.automationTextResponse,
                jsonResponse: contact,
                originalResponseIndex: responseIndex,
                contactIndex: contactIndex,
              });

              // Collect keys for table columns
              Object.keys(contact).forEach((key) => columnSet.add(key));
            });
          } else if (parsedJsonResponse) {
            this.automationResponses.push({
              textResponse: item.automationTextResponse,
              jsonResponse: parsedJsonResponse,
              originalResponseIndex: responseIndex,
              contactIndex: 0,
            });

            Object.keys(parsedJsonResponse).forEach((key) =>
              columnSet.add(key)
            );
          } else {
            this.automationResponses.push({
              textResponse: item.automationTextResponse,
              jsonResponse: null,
              originalResponseIndex: responseIndex,
              contactIndex: 0,
            });
          }
        });

        // Set unique dynamic columns
        this.tableColumns = Array.from(columnSet);
        console.log('Automation Responses:', this.automationResponses);
        console.log('Dynamic Table Columns:', this.tableColumns);
      },
      error: (error) => {
        console.error('Error fetching automation response:', error);
      },
    });
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  respondToAutomation(response: any): void {
    const contact = response.jsonResponse;

    if (!contact?.Email || contact.Email.trim() === '') {
      console.warn('Email missing. Skipping contact creation.');
      return;
    }

    const body: any = {
      Name: 'CreateContactAfterAutomation',
      Params: {
        OrganizationName: contact.OrganizationName || '',
        FirstName: contact.Firstname || '',
        LastName: contact.Lastname || '',
        Email: contact.Email || '',
        ShoppingCenterId: this.shoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        console.log('Contact created successfully:', data);
      },
      error: (error) => {
        console.error('Error creating contact:', error);
      },
    });
  }

  acceptAll(): void {
    this.automationResponses.forEach((item, index) => {
      const contact = item.jsonResponse;

      if (contact?.Email && contact.Email.trim() !== '') {
        this.respondToAutomation(item); // Pass full response object
      } else {
        console.warn(`Skipped index ${index}: Missing email.`);
      }
    });
  }
}
