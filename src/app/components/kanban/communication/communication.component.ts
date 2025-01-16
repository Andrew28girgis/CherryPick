import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  department?: string;
}

interface CallRecord {
  id: string;
  participants: CallParticipant[];
  timestamp: Date;
  duration?: number; // in seconds
  status: 'active' | 'completed' | 'missed';
  type: 'audio' | 'video';
  recording?: boolean;
  notes?: string;
  tags?: string[];
}

interface CallFilter {
  search: string;
  status: ('active' | 'completed' | 'missed')[];
  dateRange: {
    start: Date;
    end: Date;
  } | null;
}

interface Source {
  id: number;
  name: string;
  description: string;
  logo: string;
  url: string;
  loadError?: boolean;
}

@Component({
  selector: 'app-communication',
  templateUrl: './communication.component.html',
  styleUrls: ['./communication.component.css']
})
export class CommunicationComponent implements OnInit {
  sources: Source[] = [];
  calls: CallRecord[] = [];
  selectedCall: CallRecord | null = null;
  sidebarCollapsed: boolean = false;
  showAddModal: boolean = false;
  isLoading: boolean = false;
  activeTab: string = 'Done';
  activeFilter: string = 'Prospect';

  filter: CallFilter = {
    search: '',
    status: ['active', 'completed', 'missed'],
    dateRange: null
  };

  constructor() {}

  ngOnInit(): void {
    this.loadSources();
    this.loadCalls();
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = JSON.parse(savedState);
    }
  }

  loadSources(): void {
    this.isLoading = true;
    // Simulate loading sources
    setTimeout(() => {
      this.sources = [];
      this.isLoading = false;
    }, 1000);
  }

  loadCalls(): void {
    // Simulate loading calls with more detailed data
    this.calls = [
      {
        id: '1',
        participants: [{
          id: '1',
          name: 'Hassan Magdy Qasem',
          avatar: '/assets/Images/Avatars/Mark.svg',
          email: 'hassan@example.com',
          department: 'Engineering'
        }],
        timestamp: new Date(),  // Today
        duration: 1800,
        status: 'completed',
        type: 'video',
        recording: true,
        tags: ['important', 'project-review']
      },
      {
        id: '2',
        participants: [{
          id: '2',
          name: 'Andrew Cergies',
          avatar: '/assets/Images/Avatars/hassan.svg',
          email: 'andrew@example.com',
          department: 'Design'
        }],
        timestamp: new Date(),  // Today
        duration: 900,
        status: 'completed',
        type: 'audio',
        notes: 'Discussed new design system'
      },
      {
        id: '3',
        participants: [{
          id: '3',
          name: 'Diana Lolo',
          avatar: '/assets/Images/Avatars/Mark.svg',
          email: 'Diana@example.com',
          department: 'Marketing'
        }],
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),  // Yesterday
        duration: 1200,
        status: 'missed',
        type: 'video'
      },
      {
        id: '4',
        participants: [{
          id: '4',
          name: 'Sameh Seliem',
          avatar: '/assets/Images/Avatars/hassan.svg',
          email: 'sameh@example.com',
          department: 'Sales'
        }],
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),  // Yesterday
        duration: 600,
        status: 'completed',
        type: 'audio',
        recording: true
      }
    ];
  }

  toggleOptions(source: Source): void {
    // Implement options menu logic here
    console.log('Toggle options for source:', source);
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }

  selectCall(call: CallRecord): void {
    console.log('Selected call:', call); // Debugging line
    this.selectedCall = call;
  }

  startNewCall(): void {
    this.showAddModal = true;
  }

  filterCalls(): CallRecord[] {
    return this.calls.filter(call => {
      // Search by participant name
      const matchesSearch = this.filter.search ? 
        call.participants.some(p => 
          p.name.toLowerCase().includes(this.filter.search.toLowerCase())
        ) : true;

      // Filter by status
      const matchesStatus = this.filter.status.includes(call.status);

      // Filter by date range
      const matchesDate = this.filter.dateRange ? 
        call.timestamp >= this.filter.dateRange.start && 
        call.timestamp <= this.filter.dateRange.end : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  formatDuration(seconds: number | undefined): string {
    if (seconds === undefined) {
      return 'N/A';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  getFormattedTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
  }
}
