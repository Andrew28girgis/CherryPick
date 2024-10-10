export class Organization {
  description!: string;
  externalTeam!: string;
  financialData!: string;
  internalTeam!: string;
  locations!: string;
  reasons!: string;
  timeline!: TimeLine[];
}

export class TimeLine {
  city!: string;
  cityLatitude!: number;
  cityLongitude!: number;
  description!: string;
  eventDate!: string;
  eventTitle!: string;
  stateCode!: string;
}
