import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
declare const google: any;
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { ShoppingCenterTenant } from 'src/app/shared/models/PlaceCo';
import { OrgBranch } from 'src/app/shared/models/branches';
import { PlacesService } from 'src/app/core/services/places.service';
import { Demographics } from 'src/app/shared/models/demographics';

type LandingPlaceWithDemo = LandingPlace & {
  Demographics?: Demographics | string | Record<string, any>;
};

@Component({
  selector: 'app-landing2',
  templateUrl: './landing2.component.html',
  styleUrls: ['./landing2.component.css'],
})
export class Landing2Component implements OnInit {
  campaignId!: string | null;
  shoppingCenter!: LandingPlaceWithDemo | null;
  ShoppingCenterId!: number;
  NearByType: NearByType[] = [];
  PlaceId!: number;
  OrganizationBranches!: OrgBranch | null;
  shoppingId!: string | null;

  tenantGroups = {
    onSite: [] as ShoppingCenterTenant[],
    veryShort: [] as ShoppingCenterTenant[],
    walking: [] as ShoppingCenterTenant[],
    longer: [] as ShoppingCenterTenant[],
  };

  // cached census data
  censusData: Demographics = {
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

  // Derived / memoized arrays for template use
  raceItems: Array<{ label: string; count: number; percentage: number; color: string }> = [];
  educationItems: Array<{ label: string; count: number; percentage: number }> = [];
  incomeItems: Array<{ label: string; count: number; percentage: number }> = [];
  ageItems: Array<{ group: string; count: number; percentage: number }> = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService,
    private cdr: ChangeDetectorRef
  ) {}

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

    const num = (v: any, fb = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    };

    const normalizedIncome: Record<string, number> = Object.keys(income).reduce(
      (acc, k) => {
        acc[k] = num(income[k], 0);
        return acc;
      },
      {} as Record<string, number>
    );

    const normalizedAges: Record<string, number> = Object.keys(ages).reduce(
      (acc, k) => {
        acc[k] = num(ages[k], 0);
        return acc;
      },
      {} as Record<string, number>
    );

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

      incomeBrackets: {
        Total: num(income.Total),
        '<10k': num(income['<10k']),
        '10-15k': num(income['10-15k']),
        '200k+': num(income['200k+']),
      },

      ageGroups: normalizedAges as any,
    } as any;

    // assign normalized income, employment & commuting
    (this.censusData as any).incomeBrackets = normalizedIncome;

    (this.censusData as any).employment = {
      employedTotal: num(employment.employedTotal),
    };

    (this.censusData as any).commuting = {
      workersTotal: num(commuting.workersTotal),
      driveAlone: num(commuting.driveAlone),
      publicTransit: num(commuting.publicTransit),
      avgCommuteMinutes: num(commuting.avgCommuteMinutes),
    };

    // --- Derived, stable arrays for template rendering ---
    try {
      this.raceItems = this.getRaceData();
    } catch (err) {
      this.raceItems = [];
    }

    try {
      this.educationItems = this.getEducationData();
    } catch (err) {
      this.educationItems = [];
    }

    try {
      this.incomeItems = this.getIncomeData();
    } catch (err) {
      this.incomeItems = [];
    }

    try {
      this.ageItems = this.getAgeData();
    } catch (err) {
      this.ageItems = [];
    }

    // Ensure Angular updates the view immediately (if needed)
    try {
      this.cdr?.detectChanges();
    } catch (e) {
      // ignore if detectChanges throws in unusual environments
    }
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
      this.ShoppingCenterId = params.shoppiongCenterId;

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

  GetBuyBoxOrganizationDetails(Shoppingcenterid: number, PlaceId: number): void {
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
        this.hydrateCensusFromApi();
        if (this.shoppingCenter) {
          this.initializeMap(this.shoppingCenter.Latitude, this.shoppingCenter.Longitude);
        }
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
    new AdvancedMarkerElement({
      map,
      position,
      title: 'This is a marker!',
    });

    return map;
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

  // helper trackBy for ngFor
  trackByLabel(index: number, item: any) {
    return item?.label ?? item?.group ?? index;
  }
}
