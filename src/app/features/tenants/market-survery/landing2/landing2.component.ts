import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-landing2',
  
  templateUrl: './landing2.component.html',
  styleUrl: './landing2.component.css'
})
export class Landing2Component {
 censusData: any = {
    name: "Census Tract 630, Washington, DC",
    lat: 38.89768,
    lon: -77.03653,
    population: 3700,
    medianAge: 35.4,
    households: 1500,
    avgHouseholdSize: 2.4,
    medianIncome: 124563,
    perCapitaIncome: 51000,
    housing: {
      medianRent: 1875,
      medianHomeValue: 545000,
      ownerOccupied: 900,
      renterOccupied: 600,
      totalUnits: 1600,
      occupiedUnits: 1500,
      vacantUnits: 100
    },
    education: {
      highSchool: 800,
      bachelors: 1200,
      masters: 600,
      doctorate: 150
    },
    race: {
      white: 2000,
      black: 1200,
      americanIndian: 50,
      asian: 300,
      pacificIslander: 20,
      hispanic: 500
    },
    incomeBrackets: {
      Total: 1500,
      '<10k': 120,
      '10-15k': 80,
      '200k+': 450
    },
    ageGroups: {
      'Male 0-4': 200,
      'Male 5-9': 180,
      'Male 10-14': 220
    }
  };

  ngOnInit() {}

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getOwnershipPercentage(): number {
    const total = this.censusData.housing.ownerOccupied + this.censusData.housing.renterOccupied;
    return Math.round((this.censusData.housing.ownerOccupied / total) * 100);
  }

  getRenterPercentage(): number {
    const total = this.censusData.housing.ownerOccupied + this.censusData.housing.renterOccupied;
    return Math.round((this.censusData.housing.renterOccupied / total) * 100);
  }

  getEducationData() {
    const edu = this.censusData.education;
    const total = edu.highSchool + edu.bachelors + edu.masters + edu.doctorate;
    
    return [
      {
        label: 'High School',
        count: edu.highSchool,
        percentage: Math.round((edu.highSchool / total) * 100)
      },
      {
        label: 'Bachelor\'s',
        count: edu.bachelors,
        percentage: Math.round((edu.bachelors / total) * 100)
      },
      {
        label: 'Master\'s',
        count: edu.masters,
        percentage: Math.round((edu.masters / total) * 100)
      },
      {
        label: 'Doctorate',
        count: edu.doctorate,
        percentage: Math.round((edu.doctorate / total) * 100)
      }
    ];
  }

  getRaceData() {
    const race = this.censusData.race;
    const total = (Object.values(race) as number[]).reduce((sum, val) => sum + val, 0);
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    
    return [
      { label: 'White', count: race.white, percentage: Math.round((race.white / total) * 100), color: colors[0] },
      { label: 'Black', count: race.black, percentage: Math.round((race.black / total) * 100), color: colors[1] },
      { label: 'Asian', count: race.asian, percentage: Math.round((race.asian / total) * 100), color: colors[2] },
      { label: 'Hispanic', count: race.hispanic, percentage: Math.round((race.hispanic / total) * 100), color: colors[3] },
      { label: 'American Indian', count: race.americanIndian, percentage: Math.round((race.americanIndian / total) * 100), color: colors[4] },
      { label: 'Pacific Islander', count: race.pacificIslander, percentage: Math.round((race.pacificIslander / total) * 100), color: colors[5] }
    ];
  }

  getIncomeData() {
    const income = this.censusData.incomeBrackets;
    
    return [
      {
        label: 'Under $10k',
        count: income['<10k'],
        percentage: Math.round((income['<10k'] / income.Total) * 100)
      },
      {
        label: '$10k - $15k',
        count: income['10-15k'],
        percentage: Math.round((income['10-15k'] / income.Total) * 100)
      },
      {
        label: '$200k+',
        count: income['200k+'],
        percentage: Math.round((income['200k+'] / income.Total) * 100)
      }
    ];
  }

  getAgeData() {
    const ages = this.censusData.ageGroups;
    const total = Object.values(ages).reduce((sum: number, val) => sum + (val as number), 0);
    
    return [
      {
        group: 'Male 0-4',
        count: ages['Male 0-4'],
        percentage: Math.round((ages['Male 0-4'] / total) * 100)
      },
      {
        group: 'Male 5-9',
        count: ages['Male 5-9'],
        percentage: Math.round((ages['Male 5-9'] / total) * 100)
      },
      {
        group: 'Male 10-14',
        count: ages['Male 10-14'],
        percentage: Math.round((ages['Male 10-14'] / total) * 100)
      }
    ];
  }
}
