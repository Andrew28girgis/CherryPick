export interface Demographics {
  name: string;
  lat: number;
  lon: number;
  population: number;
  medianAge: number;
  households: number;
  avgHouseholdSize: number;
  medianIncome: number;
  perCapitaIncome: number;
  housing: Housing;          
  education: Education;
  race: Race;
  incomeBrackets: IncomeBrackets;
  ageGroups: Record<string, number>;
  employment?: { employedTotal?: number };
  commuting?: { workersTotal?: number; driveAlone?: number; publicTransit?: number; avgCommuteMinutes?: number; };
}
export interface Housing {
  medianRent: number;
  medianHomeValue: number;
  ownerOccupied: number;
  renterOccupied: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
}

export interface Education {
  highSchool: number;
  bachelors: number;
  masters: number;
  doctorate: number;
}

export interface Race {
  white: number;
  black: number;
  americanIndian: number;
  asian: number;
  pacificIslander: number;
  hispanic: number;
}

export interface IncomeBrackets {
  Total: number;
  '<10k': number;
  '10-15k': number;
  '200k+': number;
  [key: string]: number; 
}


