import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
declare const google: any;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { ShoppingCenterTenant } from 'src/app/shared/models/PlaceCo';
import { OrgBranch } from 'src/app/shared/models/branches';
import { PlacesService } from 'src/app/core/services/places.service';

type CensusData = {
  name: string;
  lat: number;
  lon: number;
  population: number;
  medianAge: number;
  households: number;
  avgHouseholdSize: number;
  medianIncome: number;
  perCapitaIncome: number;
  housing: {
    medianRent: number;
    medianHomeValue: number;
    ownerOccupied: number;
    renterOccupied: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
  };
  education: {
    highSchool: number;
    bachelors: number;
    masters: number;
    doctorate: number;
  };
  race: {
    white: number;
    black: number;
    americanIndian: number;
    asian: number;
    pacificIslander: number;
    hispanic: number;
  };
  incomeBrackets: {
    Total: number;
    '<10k': number;
    '10-15k': number;
    '200k+': number;
  };
  ageGroups: Record<string, number>;
  employment?: {
    employedTotal?: number;
  };
  commuting?: {
    workersTotal?: number;
    driveAlone?: number;
    publicTransit?: number;
    avgCommuteMinutes?: number;
  };
};

// Extend LandingPlace so TS allows .Demographics
type LandingPlaceWithDemo = LandingPlace & {
  Demographics?: string | Record<string, any>;
};

@Component({
  selector: 'app-landing2',
  templateUrl: './landing2.component.html',
  styleUrls: ['./landing2.component.css'],
})
export class Landing2Component implements OnInit {
  campaignId!: any;
  shoppingCenter!: LandingPlaceWithDemo;
  ShoppingCenterId!: number;
  NearByType: NearByType[] = [];
  PlaceId!: number;
  OrganizationBranches!: OrgBranch;
  shoppingId!: any;

  tenantGroups = {
    onSite: [] as ShoppingCenterTenant[],
    veryShort: [] as ShoppingCenterTenant[],
    walking: [] as ShoppingCenterTenant[],
    longer: [] as ShoppingCenterTenant[],
  };

  censusData: CensusData = {
    name: '',
    lat: 0,
    lon: 0,
    population: 0,
    medianAge: 0,
    households: 0,
    avgHouseholdSize: 0,
    medianIncome: 0,
    perCapitaIncome: 0,
    housing: {
      medianRent: 0,
      medianHomeValue: 0,
      ownerOccupied: 0,
      renterOccupied: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
    },
    education: {
      highSchool: 0,
      bachelors: 0,
      masters: 0,
      doctorate: 0,
    },
    race: {
      white: 0,
      black: 0,
      americanIndian: 0,
      asian: 0,
      pacificIslander: 0,
      hispanic: 0,
    },
    incomeBrackets: {
      Total: 0,
      '<10k': 0,
      '10-15k': 0,
      '200k+': 0,
    },
    ageGroups: {
      'Male 0-4': 0,
      'Male 5-9': 0,
      'Male 10-14': 0,
    },
  };

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private modalService: NgbModal
  ) {}

  // Tiny helper for safe number conversion
  private toNumber(n: any, fallback = 0): number {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
  }

  private hydrateCensusFromApi(): void {
    const demoRaw = this.shoppingCenter?.Demographics;
    if (!demoRaw) return;

    let demo: any;
    try {
      demo =
        typeof demoRaw === 'string' ? JSON.parse(demoRaw as string) : demoRaw;
    } catch (e) {
      console.error('Invalid Demographics JSON', e);
      return;
    }

    const housing = demo.Housing ?? {};
    const education = demo.Education ?? {};
    const race = demo.Race ?? {};
    const income = demo.IncomeBrackets ?? {};
    const ages = demo.AgeGroups ?? {};
    const employment = demo.Employment ?? {};
    const commuting = demo.Commuting ?? {};

    // Normalize helpers
    const num = (v: any, fb = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    };

    // Normalize ALL income buckets (keep every key the API provides)
    const normalizedIncome: Record<string, number> = Object.keys(income).reduce(
      (acc, k) => {
        acc[k] = num(income[k], 0);
        return acc;
      },
      {} as Record<string, number>
    );

    // Normalize ALL age groups dynamically
    const normalizedAges: Record<string, number> = Object.keys(ages).reduce(
      (acc, k) => {
        acc[k] = num(ages[k], 0);
        return acc;
      },
      {} as Record<string, number>
    );

    // Build the base object using your existing shape
    this.censusData = {
      name: demo.Name ?? '',
      lat: num(demo.Lat),
      lon: num(demo.Lon),
      population: num(demo.Population),
      medianAge: num(demo.MedianAge),
      households: num(demo.Households),
      avgHouseholdSize: num(demo.AvgHouseholdSize),
      medianIncome: num(demo.MedianIncome),
      perCapitaIncome: num(demo.PerCapitaIncome),

      housing: {
        medianRent: num(housing.medianRent),
        medianHomeValue: num(housing.medianHomeValue),
        ownerOccupied: num(housing.ownerOccupied),
        renterOccupied: num(housing.renterOccupied),
        totalUnits: num(housing.totalUnits),
        occupiedUnits: num(housing.occupiedUnits),
        vacantUnits: num(housing.vacantUnits),
      },

      education: {
        highSchool: num(education.highSchool),
        bachelors: num(education.bachelors),
        masters: num(education.masters),
        doctorate: num(education.doctorate),
      },

      race: {
        white: num(race.white),
        black: num(race.black),
        americanIndian: num(race.americanIndian),
        asian: num(race.asian),
        pacificIslander: num(race.pacificIslander),
        hispanic: num(race.hispanic),
      },

      // Keep your original keys for compatibility; we'll overwrite with full map below
      incomeBrackets: {
        Total: num(income.Total),
        '<10k': num(income['<10k']),
        '10-15k': num(income['10-15k']),
        '200k+': num(income['200k+']),
      },

      // If your type was updated to Record<string, number>, this assignment is fine.
      // If not, we will cast below to keep TS happy without changing your types here.
      ageGroups: normalizedAges as any,
    } as any;

    // Overwrite incomeBrackets with the FULL normalized map (keeps all API buckets)
    (this.censusData as any).incomeBrackets = normalizedIncome;

    // Add Employment & Commuting (typed optional)
    (this.censusData as any).employment = {
      employedTotal: num(employment.employedTotal),
    };

    (this.censusData as any).commuting = {
      workersTotal: num(commuting.workersTotal),
      driveAlone: num(commuting.driveAlone),
      publicTransit: num(commuting.publicTransit),
      avgCommuteMinutes: num(commuting.avgCommuteMinutes),
    };
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.shoppingId = params.get('shoppingId');
      this.campaignId = params.get('campaignId');
    });
    this.initializeParams();
  }

  formatNumber(num: number): string {
    return (num ?? 0).toLocaleString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount ?? 0);
  }

  getOwnershipPercentage(): number {
    const { ownerOccupied, renterOccupied } =
      this.censusData.housing || ({} as any);
    const total = (ownerOccupied || 0) + (renterOccupied || 0);
    return total ? Math.round((ownerOccupied / total) * 100) : 0;
  }

  getRenterPercentage(): number {
    const { ownerOccupied, renterOccupied } =
      this.censusData.housing || ({} as any);
    const total = (ownerOccupied || 0) + (renterOccupied || 0);
    return total ? Math.round((renterOccupied / total) * 100) : 0;
  }

  getEducationData() {
    const edu = this.censusData.education;
    const total =
      edu.highSchool + edu.bachelors + edu.masters + edu.doctorate || 0;
    const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

    return [
      {
        label: 'High School',
        count: edu.highSchool,
        percentage: pct(edu.highSchool),
      },
      {
        label: "Bachelor's",
        count: edu.bachelors,
        percentage: pct(edu.bachelors),
      },
      { label: "Master's", count: edu.masters, percentage: pct(edu.masters) },
      {
        label: 'Doctorate',
        count: edu.doctorate,
        percentage: pct(edu.doctorate),
      },
    ];
  }

  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.campaignId = params.campaignId;
      this.PlaceId = params.id;
      this.ShoppingCenterId = params.shoppiongCenterId; // ensure this matches your actual route param
      if (this.ShoppingCenterId != 0) {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, 0);
        this.GetPlaceDetails(0, this.ShoppingCenterId);
      } else {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, this.PlaceId);
        this.GetPlaceDetails(this.PlaceId, 0);
      }
      this.GetPlaceCotenants();
    });
  }

  GetPlaceCotenants(): void {
    const body: any = {
      Name: 'GetPlaceCotenants',
      Params: { ShoppingCenterId: this.ShoppingCenterId },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const tenants: ShoppingCenterTenant[] = data.json || [];

        this.tenantGroups = {
          onSite: tenants
            .filter((t) => t.Distance >= 0 && t.Distance < 100)
            .sort((a, b) => a.Distance - b.Distance),
          veryShort: tenants
            .filter((t) => t.Distance >= 100 && t.Distance < 400)
            .sort((a, b) => a.Distance - b.Distance),
          walking: tenants
            .filter((t) => t.Distance >= 400 && t.Distance < 800)
            .sort((a, b) => a.Distance - b.Distance),
          longer: tenants
            .filter((t) => t.Distance >= 800 && t.Distance <= 1200)
            .sort((a, b) => a.Distance - b.Distance),
        };
      },
    });
  }

  GetBuyBoxOrganizationDetails(
    Shoppingcenterid: number,
    PlaceId: number
  ): void {
    const body: any = {
      Name: 'GetBuyBoxOrganizationDetails',
      Params: {
        shoppingcenterid: +Shoppingcenterid,
        placeId: +PlaceId,
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json) {
          this.OrganizationBranches = data.json[0];
        }
      },
    });
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        CampaignId: this.campaignId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenter = data.json?.[0] || null;
        console.log('sss', this.shoppingCenter);

        // hydrate demographics from API → updates censusData used by the template
        this.hydrateCensusFromApi();

        this.initializeMap(
          this.shoppingCenter.Latitude,
          this.shoppingCenter.Longitude
        );
        this.initializestreetView(
          this.shoppingCenter.Latitude,
          this.shoppingCenter.Longitude
        );
        this.GetPlaceNearBy(this.PlaceId);
      },
    });
  }

  async initializeMap(lat: number, lon: number): Promise<any> {
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('marker'),
    ]);

    const position = { lat: lat || 0, lng: lon || 0 };
    const map = new Map(document.getElementById('map') as HTMLElement, {
      center: position,
      zoom: 13,
      mapId: '1234567890abcdef',
    });
    const marker = new AdvancedMarkerElement({
      map: map,
      position: position,
      title: 'This is a marker!',
    });

    return map;
  }

  initializestreetView(
    lat: number,
    lng: number,
    heading?: number,
    pitch?: number
  ) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: pitch },
        }
      );
    } else {
      // element not found; no-op
    }
  }

  GetPlaceNearBy(placeId: number): void {
    const body: any = {
      Name: 'GetNearBuyRetails',
      Params: {
        PlaceID: placeId,
        ShoppingCenterId: this.ShoppingCenterId,
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.NearByType = data.json;
      },
    });
  }

  getRaceData() {
    const race = this.censusData.race;
    const total =
      (Object.values(race) as number[]).reduce((sum, val) => sum + val, 0) || 0;
    const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

    const colors = [
      '#D1D5DB', 
      '#111827',
      '#10B981', 
      '#F59E0B', 
      '#8B5CF6', 
      '#14B8A6', 
    ];

    return [
      {
        label: 'White',
        count: race.white,
        percentage: pct(race.white),
        color: colors[0],
      },
      {
        label: 'Black',
        count: race.black,
        percentage: pct(race.black),
        color: colors[1],
      },
      {
        label: 'Asian',
        count: race.asian,
        percentage: pct(race.asian),
        color: colors[2],
      },
      {
        label: 'Hispanic',
        count: race.hispanic,
        percentage: pct(race.hispanic),
        color: colors[3],
      },
      {
        label: 'American Indian',
        count: race.americanIndian,
        percentage: pct(race.americanIndian),
        color: colors[4],
      },
      {
        label: 'Pacific Islander',
        count: race.pacificIslander,
        percentage: pct(race.pacificIslander),
        color: colors[5],
      },
    ];
  }

  // logical order for API income bracket KEYS (not display labels)
  private readonly incomeOrder: string[] = [
    '<10k',
    '10-15k',
    '15-20k',
    '20-25k',
    '25-30k',
    '30-35k',
    '35-40k',
    '40-45k',
    '45-50k',
    '50-60k',
    '60-75k',
    '75-100k',
    '100-125k',
    '125-150k',
    '150-200k',
    '200k+',
    'Total',
  ];
  getIncomeData() {
    const income: Record<string, any> =
      (this.censusData as any).incomeBrackets || {};

    // Prefer API "Total"; else compute it
    const explicitTotal = this.toNumber(income['Total'], 0);
    const computedTotal = Object.entries(income)
      .filter(([k]) => k !== 'Total')
      .reduce((s, [, v]) => s + this.toNumber(v, 0), 0);
    const total = explicitTotal || computedTotal || 0;

    type Item = {
      label: string;
      count: number;
      percentage: number;
      _key: string;
    };

    const items: Item[] = Object.keys(income)
      .filter((k) => k !== 'Total')
      .map((k) => {
        const count = this.toNumber(income[k], 0);
        const percentage = total ? Math.round((count / total) * 100) : 0;

        const label =
          k === '<10k'
            ? 'Under $10k'
            : k === '200k+'
            ? '$200k+'
            : k.includes('-')
            ? `$${k.replace('-', ' - $')}`
            : k;

        return { label, count, percentage, _key: k };
      });

    items.sort((a, b) => {
      const ia = this.incomeOrder.indexOf(a._key);
      const ib = this.incomeOrder.indexOf(b._key);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    return items.map(({ _key, ...rest }) => rest);
  }

  getAgeData() {
    const ages: Record<string, number> = this.censusData.ageGroups || {};
    const entries = Object.entries(ages).map(([group, val]) => ({
      group,
      count: Number(val) || 0,
    }));
    const total = entries.reduce((s, e) => s + e.count, 0);

    // Sort by the first number in the label if present (so 0-4, 5-9, 10-14, 15-17, 18-19, ...)
    const startNum = (label: string) => {
      const m = label.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
    };
    entries.sort((a, b) => {
      const sa = startNum(a.group),
        sb = startNum(b.group);
      return sa === sb ? a.group.localeCompare(b.group) : sa - sb;
    });

    return entries.map((e) => ({
      group: e.group,
      count: e.count,
      percentage: total ? Math.round((e.count / total) * 100) : 0,
    }));
  }
}
