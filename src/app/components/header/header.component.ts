import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidbarService } from 'src/app/shared/services/sidbar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  isCollapsed = true;
  notifications: any[] = [
    { id: 1, message: 'New notification 1', time: '5 min ago' },
    { id: 2, message: 'New notification 2', time: '1 hour ago' },
    { id: 3, message: 'New notification 3', time: '2 hours ago' },
  ];

  emails: any[] = [
    {
      id: 1,
      subject: 'Upcoming meeting',
      from: 'john@example.com',
      time: '10:00 AM',
    },
    {
      id: 2,
      subject: 'Project update',
      from: 'sarah@example.com',
      time: '11:30 AM',
    },
    {
      id: 3,
      subject: 'Weekly report',
      from: 'mike@example.com',
      time: '2:00 PM',
    },
  ];

  // Avatar and view switching properties
  userAvatar: string | null = null;
  currentView: 'tenant' | 'landlord' = 'tenant'; // Default view, should be set from backend
  tenantRoute = '/Kanban'; // Replace with actual route
  landlordRoute = '/manage-properties'; // Replace with actual route

  @ViewChild('emailContent') emailContent!: TemplateRef<any>;
  @ViewChild('notificationContent') notificationContent!: TemplateRef<any>;

  constructor(private sidbarService: SidbarService, public router: Router) {
    this.sidbarService.isCollapsed.subscribe((state: boolean) => {
      this.isCollapsed = state;
    });
  }

  ngOnInit(): void {
    // Fetch user data from backend
    this.fetchUserData();
  }

  fetchUserData(): void {
    // This is a placeholder for the actual API call
    // In a real application, you would call your backend service here

    // Simulate getting data from backend
    setTimeout(() => {
      // Example: Set avatar from backend response
      this.userAvatar = ''; // Replace with actual avatar URL

      // Example: Get current view from backend
      // this.currentView = backendResponse.userRole;

      // For demo purposes, we'll just set a default
      this.currentView = 'tenant';
    }, 500);
  }

  toggleSidebar() {
    this.sidbarService.toggleSidebar();
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  BackTo() {
    this.router.navigate(['/dashboard']);
  }

  isNavbarOpen = false;

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen;
  }
}
