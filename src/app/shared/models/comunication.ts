export interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface CallRecord {
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

export interface CallFilter {
  search: string;
  status: ('active' | 'completed' | 'missed')[];
  dateRange: {
    start: Date;
    end: Date;
  } | null;
}

export interface Source {
  id: number;
  name: string;
  description: string;
  logo: string;
  url: string;
  loadError?: boolean;
}