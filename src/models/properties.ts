export interface Property {
    id: number;
    title: string;
    address: string;
    image: string;
    isFavorite: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    metrics: {
      nearestCompetitor: string;
      nearestCompTenant: string;
      purchasePrice: string;
      availableUnits: number;
      unitSizes: string;
    };
    broker: {
      name: string;
      logo: string;
    };
  }
  
  export  interface FilterTag {
    id: string;
    icon: string;
    label: string;
    active: boolean;
  }