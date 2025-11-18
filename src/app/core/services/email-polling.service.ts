import { Injectable, OnDestroy } from '@angular/core';
import { Subject, interval, Subscription, switchMap, takeUntil } from 'rxjs';
import { PlacesService } from './places.service';

@Injectable({
  providedIn: 'root'
})
export class EmailPollingService implements OnDestroy {
  private pollingSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private readonly POLLING_INTERVAL = 2000; // 2 seconds

  constructor(private placesService: PlacesService) {}

  startPolling(contactId: number, callback: (emails: any[]) => void): void {
    // Stop any existing polling
    this.stopPolling();

    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          const body = {
            Name: 'GetContactEmails',
            MainEntity: null,
            Params: { Id: contactId },
            Json: null,
          };
          return this.placesService.GenericAPI(body);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: any) => {
          const emails = data.json || [];
          callback(emails);

          // Stop polling if all emails are verified
          const hasPendingEmails = emails.some((email: any) => 
            email.status && email.status.toLowerCase() === 'pending'
          );

          if (!hasPendingEmails && emails.length > 0) {
            this.stopPolling();
          }
        },
        error: (error) => {
          console.error('Error polling emails:', error);
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}