import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { LandingPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { ShoppingCenterTenant } from 'src/app/shared/models/PlaceCo';
import { OrgBranch } from 'src/app/shared/models/branches';
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
  campaignId: string | null = null;
  shoppingCenter: LandingPlaceWithDemo | null = null;
  shoppingId: string | null = null;
  ShoppingCenterId = 0;
  PlaceId = 0;
  NearByType: NearByType[] = [];
  OrganizationBranches: OrgBranch | null = null;

  tenantGroups: Record<string, ShoppingCenterTenant[]> = {
    onSite: [],
    veryShort: [],
    walking: [],
    longer: [],
  };

  censusData: Demographics = {
    name: '', lat: 0, lon: 0, population: 0, medianAge: 0, households: 0,
    avgHouseholdSize: 0, medianIncome: 0, perCapitaIncome: 0,
    housing: { medianRent: 0, medianHomeValue: 0, ownerOccupied: 0, renterOccupied: 0, totalUnits: 0, occupiedUnits: 0, vacantUnits: 0 },
    education: { highSchool: 0, bachelors: 0, masters: 0, doctorate: 0 },
    race: { white: 0, black: 0, americanIndian: 0, asian: 0, pacificIslander: 0, hispanic: 0 },
    incomeBrackets: { Total: 0, '<10k': 0, '10-15k': 0, '200k+': 0 },
    ageGroups: {},
  };

  raceItems: any[] = [];
  educationItems: any[] = [];
  incomeItems: any[] = [];
  ageItems: any[] = [];

  private readonly incomeOrder = [
    '<10k','10-15k','15-20k','20-25k','25-30k','30-35k','35-40k','40-45k',
    '45-50k','50-60k','60-75k','75-100k','100-125k','125-150k','150-200k','200k+','Total'
  ];

  constructor(
    private route: ActivatedRoute,
    private places: PlacesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Record<string, any>) => {
      this.shoppingId = params['shoppingId'];
      this.campaignId = params['campaignId'] === 'undefined' ? null : params['campaignId'];
      this.PlaceId = +params['id'] || 0;
      this.ShoppingCenterId = +params['shoppiongCenterId'] || 0;
      this.GetPlaceDetails(this.PlaceId, this.ShoppingCenterId);
    });
  }

  private GetPlaceDetails(placeId: number, shoppingCenterId: number): void {
    this.places.GenericAPI({
      Name: 'GetShoppingCenterDetails',
      Params: { PlaceID: placeId, shoppingcenterId: shoppingCenterId, CampaignId: this.campaignId },
    }).subscribe({
      next: (res) => {
        this.shoppingCenter = res.json?.[0] || null;
        if (this.shoppingCenter?.Demographics) this.DemographicsDetails();
      },
    });
  }

  private DemographicsDetails(): void {
    let demo: any;
    try {
      const raw = this.shoppingCenter?.Demographics;
      demo = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error('Invalid Demographics JSON', e);
      return;
    }

    const num = (v: any) => (Number.isFinite(+v) ? +v : 0);
    const g = (o: any, k: string) => (o?.[k] ? num(o[k]) : 0);

    this.censusData = {
      name: demo['Name'] ?? '',
      lat: num(demo['Lat']), lon: num(demo['Lon']),
      population: num(demo['Population']), medianAge: num(demo['MedianAge']),
      households: num(demo['Households']), avgHouseholdSize: num(demo['AvgHouseholdSize']),
      medianIncome: num(demo['MedianIncome']), perCapitaIncome: num(demo['PerCapitaIncome']),
      housing: {
        medianRent: g(demo['Housing'], 'medianRent'),
        medianHomeValue: g(demo['Housing'], 'medianHomeValue'),
        ownerOccupied: g(demo['Housing'], 'ownerOccupied'),
        renterOccupied: g(demo['Housing'], 'renterOccupied'),
        totalUnits: g(demo['Housing'], 'totalUnits'),
        occupiedUnits: g(demo['Housing'], 'occupiedUnits'),
        vacantUnits: g(demo['Housing'], 'vacantUnits'),
      },
      education: {
        highSchool: g(demo['Education'], 'highSchool'),
        bachelors: g(demo['Education'], 'bachelors'),
        masters: g(demo['Education'], 'masters'),
        doctorate: g(demo['Education'], 'doctorate'),
      },
      race: {
        white: g(demo['Race'], 'white'),
        black: g(demo['Race'], 'black'),
        americanIndian: g(demo['Race'], 'americanIndian'),
        asian: g(demo['Race'], 'asian'),
        pacificIslander: g(demo['Race'], 'pacificIslander'),
        hispanic: g(demo['Race'], 'hispanic'),
      },
      incomeBrackets: demo['IncomeBrackets'] ?? {},
      ageGroups: demo['AgeGroups'] ?? {},
      employment: demo['Employment'] ?? {},
      commuting: demo['Commuting'] ?? {},
    } as any;

    this.raceItems = this.mapRace();
    this.educationItems = this.mapEducation();
    this.incomeItems = this.mapIncome();
    this.ageItems = this.mapAge();

    try { this.cdr.detectChanges(); } catch {}
  }

  formatNumber = (n: number) => (n ?? 0).toLocaleString();
  formatCurrency = (a: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(a ?? 0);
  private pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0);

  private mapEducation() {
    const e = this.censusData.education;
    const total = e.highSchool + e.bachelors + e.masters + e.doctorate;
    return [
      { label: 'High School', count: e.highSchool },
      { label: "Bachelor's", count: e.bachelors },
      { label: "Master's", count: e.masters },
      { label: 'Doctorate', count: e.doctorate },
    ].map(i => ({ ...i, percentage: this.pct(i.count, total) }));
  }

  private mapRace() {
    const r = this.censusData.race;
    const total = Object.values(r).reduce((a, b) => a + b, 0);
    const keys = ['white','black','asian','hispanic','americanIndian','pacificIslander'];
    const labels = ['White','Black','Asian','Hispanic','American Indian','Pacific Islander'];
    const colors = ['#D1D5DB','#111827','#10B981','#F59E0B','#8B5CF6','#14B8A6'];
    return keys.map((k, i) => ({
      label: labels[i],
      count: r[k as keyof typeof r],
      percentage: this.pct(r[k as keyof typeof r], total),
      color: colors[i],
    }));
  }

  private mapIncome() {
    const inc = this.censusData.incomeBrackets as Record<string, any>;
    const total = inc['Total'] || Object.values(inc).reduce((a, b) => a + (+b || 0), 0);
    return Object.entries(inc)
      .filter(([k]) => k !== 'Total')
      .map(([k, v]) => ({
        label: k === '<10k' ? 'Under $10k' : k === '200k+' ? '$200k+' : k.includes('-') ? `$${k.replace('-', ' - $')}` : k,
        count: +v || 0,
        percentage: this.pct(+v || 0, total),
        _key: k,
      }))
      .sort((a, b) => this.incomeOrder.indexOf(a._key) - this.incomeOrder.indexOf(b._key))
      .map(({ _key, ...rest }) => rest);
  }

  private mapAge() {
    const ages = this.censusData.ageGroups || {};
    const arr = Object.entries(ages).map(([group, count]) => ({ group, count: +count || 0 }));
    const total = arr.reduce((s, a) => s + a.count, 0);
    return arr
      .sort((a, b) => parseInt(a.group.match(/\d+/)?.[0] || '0') - parseInt(b.group.match(/\d+/)?.[0] || '0'))
      .map(i => ({ ...i, percentage: this.pct(i.count, total) }));
  }

  trackByLabel = (_: number, item: any) => item?.label ?? item?.group ?? _;
}
