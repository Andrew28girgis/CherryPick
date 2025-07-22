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
        // Process each response in the array and flatten contacts
        this.automationResponses = [];

        data.json.forEach((item: any, responseIndex: number) => {
          let parsedJsonResponse = null;

          // Parse the JSON string to an object/array
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
            // Already an object
            parsedJsonResponse = item.automationJsonResponse;
          }

          // Check if parsedJsonResponse is an array (multiple contacts)
          if (Array.isArray(parsedJsonResponse)) {
            // Add each contact as a separate response item
            parsedJsonResponse.forEach((contact: any, contactIndex: number) => {
              this.automationResponses.push({
                textResponse: item.automationTextResponse,
                jsonResponse: contact,
                originalResponseIndex: responseIndex,
                contactIndex: contactIndex,
              });
            });
          } else if (parsedJsonResponse) {
            // Single contact object
            this.automationResponses.push({
              textResponse: item.automationTextResponse,
              jsonResponse: parsedJsonResponse,
              originalResponseIndex: responseIndex,
              contactIndex: 0,
            });
          } else {
            // No valid JSON response, still add the text response
            this.automationResponses.push({
              textResponse: item.automationTextResponse,
              jsonResponse: null,
              originalResponseIndex: responseIndex,
              contactIndex: 0,
            });
          }
        });

        console.log('Automation Responses:', this.automationResponses);
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
    if (!response?.Email || response.Email.trim() === '') {
      console.warn('Email missing. Skipping contact creation.');
      return;
    }

    const body: any = {
      Name: 'CreateContactAfterAutomation',
      Params: {
        OrganizationName: response.OrganizationName || '',
        FirstName: response.Firstname || '',
        LastName: response.Lastname || '',
        Email: response.Email || '',
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
      const response = item.jsonResponse;

      if (response?.Email && response.Email.trim() !== '') {
        this.respondToAutomation(response);
      } else {
        console.warn(`Skipped index ${index}: Missing email.`);
      }
    });
  }
}
