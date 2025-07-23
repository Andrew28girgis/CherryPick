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
  automationResponses: any[] = [];
  tableColumns: string[] = [];
  shoppingCenterId!: number;
  shoppingCenterDetails: any;
  shoppingCenterName: string = '';
  conclusionMessage: string = ''; // Added to store the conclusion message
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

          // Extract the conclusion message
          if (parsedJsonResponse?.ConclusionMessage) {
            this.conclusionMessage = parsedJsonResponse.ConclusionMessage;
          }

          const pushContact = (contact: any, contactIndex: number) => {
            this.automationResponses.push({
              conclusionMessage: this.conclusionMessage, // Store the message with each contact
              jsonResponse: contact,
              originalResponseIndex: responseIndex,
              contactIndex: contactIndex,
            });

            Object.keys(contact).forEach((key) => columnSet.add(key));
          };

          // Handle the new structure with Contacts
          if (
            parsedJsonResponse?.Contacts &&
            Array.isArray(parsedJsonResponse.Contacts)
          ) {
            parsedJsonResponse.Contacts.forEach(
              (contact: any, contactIndex: number) => {
                pushContact(contact, contactIndex);
              }
            );
          } else if (parsedJsonResponse && !parsedJsonResponse.Contacts) {
            // Fallback for old structure
            if (Array.isArray(parsedJsonResponse)) {
              parsedJsonResponse.forEach(
                (contact: any, contactIndex: number) => {
                  pushContact(contact, contactIndex);
                }
              );
            } else {
              pushContact(parsedJsonResponse, 0);
            }
          } else {
            // No contacts found
            this.automationResponses.push({
              conclusionMessage: this.conclusionMessage,
              jsonResponse: null,
              originalResponseIndex: responseIndex,
              contactIndex: 0,
            });
          }
        });

        // Handle column names: merge firstname + lastname into one 'Name' column
        let columnArray = Array.from(columnSet);

        if (
          columnArray.includes('firstname') ||
          columnArray.includes('lastname')
        ) {
          columnArray = columnArray.filter(
            (col) => col !== 'firstname' && col !== 'lastname'
          );
          columnArray.unshift('Name'); // or push if you want it at the end
        }

        this.tableColumns = columnArray;

        console.log('Automation Responses:', this.automationResponses);
        console.log('Dynamic Table Columns:', this.tableColumns);
        console.log('Consolidated Message:', this.conclusionMessage);
      },
      error: (error) => {
        console.error('Error fetching automation response:', error);
      },
    });

    this.GetShoppingCenterDetailsById();
  }

  GetShoppingCenterDetailsById(): void {
    if (!this.shoppingCenterId) {
      // Wait and retry after a short delay if shoppingCenterId is not yet set
      setTimeout(() => this.GetShoppingCenterDetailsById(), 100);
      return;
    }
    const body: any = {
      Name: 'GetShoppingCenterDetailsById',
      MainEntity: null,
      Params: {
        shoppingCenterId: this.shoppingCenterId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.shoppingCenterDetails = data.json;
        this.shoppingCenterName =
          this.shoppingCenterDetails?.CenterName || 'Unknown Shopping Center';
        console.log('Shopping Center Details:', this.shoppingCenterDetails);
        console.log('Shopping Center Name:', this.shoppingCenterName);
      },
    });
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  // New method to validate email format
  isValidEmail(email: string): boolean {
    return (
      typeof email === 'string' && email.trim() !== '' && email.includes('@')
    );
  }

  respondToAutomation(response: any): void {
    const contact = response.jsonResponse;

    if (!this.isValidEmail(contact?.email)) {
      console.warn('Invalid or missing email. Skipping contact creation.');
      return;
    }

    const body: any = {
      Name: 'CreateContactAfterAutomation',
      Params: {
        OrganizationName: contact.organizationname || '',
        FirstName: contact.firstname || '',
        LastName: contact.lastname || '',
        Email: contact.email || '',
        Position: contact.position || '',
        ShoppingCenterId: this.shoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
        this.showToast('Contact created successfully!');
      },
      error: (error) => {
        console.error('Error creating contact:', error);
        this.showToast('Error creating contact. Please try again.');
      },
    });
  }

  acceptAll(): void {
    this.automationResponses.forEach((item, index) => {
      const contact = item.jsonResponse;

      if (this.isValidEmail(contact?.email)) {
        this.respondToAutomation(item);
      } else {
        console.warn(`Skipped index ${index}: Invalid or missing email.`);
      }
    });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    } else {
      console.warn('Toast elements not found in DOM.');
    }
  }
  close() {
    if ((window as any).chrome?.webview?.postMessage) {
      (window as any).chrome.webview.postMessage('close-automation-window');
      console.log('Close message sent to webview');
    } else {
      console.warn('chrome.webview is not available on this platform');
    }

    return false;
  }
}
