import { Component,  OnInit,  TemplateRef, ViewChild,  OnDestroy } from "@angular/core"
import  { PlacesService } from "src/app/core/services/places.service"
import  { NgxSpinnerService } from "ngx-spinner"
import { CommonModule } from "@angular/common"
import  {
  EmailNotificationResponse,
  notificationCategory,
  SubmissionNotificationResponse,
  SyncNotificationResponse,
} from "src/app/shared/models/notificationCategory"
import {  Router, RouterModule } from "@angular/router"
import  { NgbModal } from "@ng-bootstrap/ng-bootstrap"
import  { EmilyService } from "src/app/core/services/emily.service"
import { Subscription } from "rxjs"

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent implements OnInit, OnDestroy {
  UserNotifications: notificationCategory[] = []
  ContactId!: number
  NotificationCategoryAction: any = {}
  emailData: EmailNotificationResponse[] = []
  categoryNames = {
    1: "Reactions",
    2: "Email Generated",
    3: "Sync",
    4: "Proposal Submissions",
  }
  @ViewChild("EmailView", { static: false }) EmailView!: TemplateRef<any>
  selectedEmailIndex = 0 // Track the currently selected email

  isLoading = true
  skeletonArray = Array(3).fill(0)
  private subscriptions = new Subscription()
  constructor(
    private placesService: PlacesService,
    private router: Router,
    private modalService: NgbModal,
    private emilyService: EmilyService,
  ) {}

  ngOnInit(): void {
    const storedContactId = localStorage.getItem("contactId")
    if (storedContactId) {
      this.ContactId = +storedContactId
      this.GetUserNotifications()
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }


  GetUserNotifications(): void {
    this.isLoading = true // Show skeleton

    const body: any = {
      Name: "GetUserNotifications",
      Params: {
        ContactId: this.ContactId,
      },
    }

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.UserNotifications = res.json || []
        this.isLoading = false // Hide skeleton
             
      },
      error: () => {
        this.isLoading = false // Hide skeleton on error
             
      },
    })

    this.subscriptions.add(subscription)
  }

  getNotificationsByCategory(categoryId: number): notificationCategory[] {
    return this.UserNotifications.filter((notification) => notification.notificationCategoryId === categoryId).sort(
      (a, b) => {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      },
    )
  }

  markAsRead(notification: notificationCategory): void {
    notification.isRead = true
  }

  GetNotificationActions(notification: notificationCategory): void {
    this.isLoading = true // Show skeleton
         

    const body: any = {
      Name: "GetNotificationActions",
      Params: {
        NotificationId: notification.id,
      },
    }

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.isLoading = false // Hide skeleton
             

        if (!res.json) {
          console.error("Empty response from GetNotificationActions")
          return
        }
        this.NotificationCategoryAction = res.json
        // Handle different notification categories
        switch (notification.notificationCategoryId) {
          case 2: // Email Generated
            // Make sure we're handling the array of emails properly
            if (Array.isArray(this.NotificationCategoryAction)) {
              this.emailData = this.NotificationCategoryAction
              this.selectedEmailIndex = 0 // Reset to first email
              this.openEmailModal()
            } else {
              console.error("Expected array for email data but got:", this.NotificationCategoryAction)
            }
            break

          case 3: // Sync
            try {
              const syncData = this.NotificationCategoryAction[0] as SyncNotificationResponse
              if (syncData && syncData.id && syncData.organizationId && syncData.name) {
                console.log("Navigating to market-survey with params:", syncData)
                this.router.navigate(["/market-survey", syncData.id, syncData.organizationId, syncData.name])
              } else {
                console.error("Invalid sync data format:", syncData)
              }
            } catch (error) {
              console.error("Error processing sync notification:", error)
            }
            break

          case 4: // Proposal Submissions
            try {
              const submissionData = this.NotificationCategoryAction[0] as SubmissionNotificationResponse
              if (submissionData && submissionData.actionId) {
                console.log("Navigating to submissions with actionId:", submissionData.actionId)
                this.router.navigate(["/submissions", submissionData.actionId])
              } else {
                console.error("Invalid submission data format:", submissionData)
              }
            } catch (error) {
              console.error("Error processing submission notification:", error)
            }
            break

          default:
            console.log("Unhandled notification category:", notification.notificationCategoryId)
        }
      },
      error: (err) => {
        console.error("Error fetching notification actions", err)
        this.isLoading = false // Hide skeleton on error
             
      },
    })

    this.subscriptions.add(subscription)
  }

  openEmailModal(): void {
    this.modalService.open(this.EmailView, {
      size: "lg",
      centered: true,
      scrollable: true,
    })
  }

  // For navigating between multiple emails in the modal
  nextEmail(): void {
    if (this.selectedEmailIndex < this.emailData.length - 1) {
      this.selectedEmailIndex++
    }
  }
  previousEmail(): void {
    if (this.selectedEmailIndex > 0) {
      this.selectedEmailIndex--
    }
  }
  // Helper method to get current email
  getCurrentEmail(): EmailNotificationResponse {
    return this.emailData[this.selectedEmailIndex]
  }
  // Send a single email
  sendEmail(email: EmailNotificationResponse): void {
    // Only proceed if direction is equal to 4
    if (email.direction !== 4) {
      console.log("Email not sent - direction is not 4:", email.id)
      return
    }

    this.isLoading = true // Show skeleton
         

    const body: any = {
      Name: "SendMail",
      MainEntity: null,
      Params: {
        MailId: email.id,
      },
      Json: null,
    }

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.showToast("Email sent successfully")
        this.modalService.dismissAll()
        this.isLoading = false // Hide skeleton
             
      },
      error: () => {
        this.isLoading = false // Hide skeleton on error
             
      },
    })

    this.subscriptions.add(subscription)
  }

  // Send all emails
  sendAllEmails(): void {
    // Filter emails to only include those with direction = 4
    const eligibleEmails = this.emailData.filter((email) => email.direction === 4)
    // If no eligible emails, return early
    if (eligibleEmails.length === 0) {
      console.log("No eligible emails to send (direction = 4)")
      return
    }

    // Create a counter to track when all emails are sent - use filtered length
    let emailCount = eligibleEmails.length
    let successCount = 0
    let errorCount = 0

    this.isLoading = true // Show skeleton
         

    // Send each eligible email one by one - iterate through filtered array
    eligibleEmails.forEach((email) => {
      const body: any = {
        Name: "SendMail",
        MainEntity: null,
        Params: {
          MailId: email.id,
        },
        Json: null,
      }

      const subscription = this.placesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast("Emails sent successfully")
          successCount++
          // Check if all emails have been processed
          if (--emailCount === 0) {
            this.modalService.dismissAll()
            this.isLoading = false // Hide skeleton
                 
          }
        },
        error: () => {
          errorCount++
          // Check if all emails have been processed
          if (--emailCount === 0) {
            this.isLoading = false // Hide skeleton on error
                 
          }
        },
      })

      this.subscriptions.add(subscription)
    })
  }

  showToast(message: string) {
    const toast = document.getElementById("customToast")
    const toastMessage = document.getElementById("toastMessage")
    toastMessage!.innerText = message
    toast!.classList.add("show")
    setTimeout(() => {
      toast!.classList.remove("show")
    }, 3000)
  }

  getCampaignOrganizations(buboxId: number, campaignId: number): void {
    this.isLoading = true // Show skeleton
         

    const body: any = {
      Name: "GetCampaignOrganizations",
      Params: { CampaignId: campaignId },
    }

    const subscription = this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          const organizationsIds = [...new Set(response.json.map((o: any) => o.organizationId))]
          const organizations: {
            id: number
            contacts: any[]
          }[] = organizationsIds.map((id) => {
            return { id: id as number, contacts: [] }
          })
          const emilyObject: { buyboxId: number[]; organizations: any[] } = {
            buyboxId: [buboxId],
            organizations: organizations,
          }
          this.emilyService.updateCheckList(emilyObject)
          this.router.navigate(["/MutipleEmail"])
        }
        this.isLoading = false // Hide skeleton
             
      },
      error: () => {
        this.isLoading = false // Hide skeleton on error
             
      },
    })

    this.subscriptions.add(subscription)
  }
}

