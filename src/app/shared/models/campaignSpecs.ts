export interface CampaignSpecs {
  campaignName?: string;
  client?: {
    clientName?: string;
    company?: string;
  };
  siteType: string | string[];
  secondaryType?: string;
  placementType?: string;

  locationCriteria?: {
    country?: string;
    locations?: Array<{
      state?: string;
      city?: string;
      neighborhoodId?: number;
      neighborhoodName?: string;
    }>;
    proximityTo?: Array<{
      landmark?: string;
      maxDistanceMiles?: number;
    }>;
  };

  demographicCriteria?: {
    tradeAreas?: Array<{
      label?: string;
      radiusMiles?: number;
      driveTimeMinutes?: number;
      walkTimeMinutes?: number;
      metrics?: {
        totalPopulationMin?: number;
        daytimePopulationMin?: number;
        householdsMin?: number;
        populationDensityMinPerSqMi?: number;
        medianHouseholdIncomeMin?: number;
        avgHouseholdIncomeMin?: number;
        growth5YrMinPct?: number;
        ownerOccupiedMinPct?: number;
        ageDistributionMinPct?: {
          age0to17?: number;
          age18to24?: number;
          age25to34?: number;
          age35to44?: number;
          age45to54?: number;
          age55to64?: number;
          age65plus?: number;
        };
        educationAttainmentMinPct?: {
          hsOrLess?: number;
          someCollege?: number;
          bachelorsOrHigher?: number;
        };
      };
    }>;
    trafficCounts?: Array<{
      roadName?: string;
      minAADT?: number;
      measurementYear?: number;
    }>;
    pointsOfInterest?: Array<{
      category?: string;
      minCountWithinMiles?: number;
      radiusMiles?: number;
    }>;
    customerSegments?: Array<{
      segmentCode?: string;
      minIndex?: number;
    }>;
    metrics?: {
      totalPopulationMin?: number;
    };
  };

  sizeRequirements?: {
    minLotSizeSqFt?: number;
    maxLotSizeSqFt?: number;
    minBuildingSizeSqFt?: number;
    maxBuildingSizeSqFt?: number;
    parkingSpacesRequired?: number;
  };

  financialCriteria?: {
    budgetMin?: number;
    budgetMax?: number;
    leaseRateMaxPerSqFt?: number;
    purchasePreferred?: boolean;
    leasePreferred?: boolean;
  };

  zoningRequirements?: string[];

  tenantPreferences?: {
    complimentaryTenants?: string[];
    competitors?: string[];
    conflictingTenants?: string[];
  };

  timing?: {
    requiredBy?: string;
    leaseTermYears?: number;
  };

  specialRequirements?: string[];
  additionalComments?: string;

  lastUpdated?: string;
}
