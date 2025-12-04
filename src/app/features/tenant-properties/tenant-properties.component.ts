import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-tenant-properties',
  templateUrl: './tenant-properties.component.html',
  styleUrls: ['./tenant-properties.component.css'],
})
export class TenantPropertiesComponent implements OnInit {
  
  organizationId: any;
  tenant: any = null;

  generalSpecs: any[] = [];
  selectedPropertyIds: number[] = [];
  selectedProperties: any[] = [];

  groupedGeneralSpecs: Record<string, any[]> = {};
  groupedSelectedProperties: Record<string, any[]> = {};
  
  previousValues: { [id: number]: any } = {};
  dropdownOpen = false;
  searchText = '';

  constructor(
    private placesService: PlacesService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.organizationId = params.organizationId;
    });

    this.loadGeneralSpecifications();
    this.loadOrganizationSpecifications();
  }

  /* -----------------------------------------------------
     LOAD GENERAL SPECS
     ----------------------------------------------------- */
  loadGeneralSpecifications() {
    const body = { Name: 'GetGeneralSpecifications', Params: {} };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.generalSpecs = res.json || [];
        this.groupedGeneralSpecs = this.groupByGroup(this.generalSpecs);
      },
    });
  }

  /* -----------------------------------------------------
     LOAD ORG SPECS
     ----------------------------------------------------- */
  loadOrganizationSpecifications() {
    const body = {
      Name: 'GetOrganizationSpecs',
      Params: { Id: this.organizationId },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const result = res.json || [];
        if (!result.length) return;

        this.tenant = {
          organizationName: result[0].organizationName,
          organizationLogo: result[0].organizationLogo,
        };

        const props = result
          .filter((x: any) => x.realEstateSpecificationId)
          .map((x: any) => ({
            id: x.realEstateSpecificationId,
            specificationName: x.realEstateSpecificationName,
            specificationType: x.specificationType,
            specificationGroup: x.specificationGroup,   // ⭐ NEW
            value: x.value,
          }));

        setTimeout(() => {
          this.selectedPropertyIds = props.map((p:any) => p.id);
          this.selectedProperties = [...props];
          this.groupedSelectedProperties = this.groupByGroup(this.selectedProperties);
        }, 0);
      },
    });
  }

  /* -----------------------------------------------------
     GROUPING FUNCTION (USED BY BOTH DROPDOWN & EDITOR)
     ----------------------------------------------------- */
  groupByGroup(list: any[]) {
    const groups: any = {};
    list.forEach(item => {
      const groupName = item.specificationGroup || 'Other';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });
    return groups;
  }

  /* -----------------------------------------------------
     DROPDOWN CONTROL
     ----------------------------------------------------- */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnClickOutside(event: any) {
    if (!event.target.closest('.property-dropdown')) {
      this.dropdownOpen = false;
    }
  }

  /* -----------------------------------------------------
     SELECTION CONTROL
     ----------------------------------------------------- */
  onPropertyToggle(id: number) {
    const isSelected = this.selectedPropertyIds.includes(id);
    if (isSelected) {
      this.removePropertySelection(id);
    } else {
      this.addPropertySelection(id);
    }
  }

  addPropertySelection(id: number) {
    if (!this.selectedPropertyIds.includes(id)) {
      this.selectedPropertyIds.push(id);
    }

    const body = {
      Name: 'InsertOrganizationSpecsRef',
      Params: {
        OrganizationId: this.organizationId,
        RealEstateSpecificationIds: id.toString(),
      },
    };

    this.placesService.GenericAPI(body).subscribe(() => {
      this.showToast('Property added');
      this.loadOrganizationSpecifications();
    });
  }

  removePropertySelection(id: number) {
    this.selectedPropertyIds = this.selectedPropertyIds.filter(x => x !== id);
    delete this.previousValues[id];

    const body = {
      Name: 'DeleteOrganizationSpec',
      Params: {
        OrganizationId: this.organizationId,
        RealEstateSpecificationId: id,
      },
    };

    this.placesService.GenericAPI(body).subscribe(() => {
      this.showToast('Property removed');
      this.loadOrganizationSpecifications();
    });
  }

  /* -----------------------------------------------------
     VALUE EDITING
     ----------------------------------------------------- */
  recordInitialValue(property: any) {
    this.previousValues[property.id] = property.value;
  }

  updatePropertyValue(property: any) {
    const oldValue = this.previousValues[property.id];
    const newValue = property.value;

    if (oldValue === newValue || (oldValue == null && newValue === '')) return;

    const body = {
      Name: 'InsertOrganizationSpecValue',
      Params: {
        RealEstateSpecificationId: property.id,
        OrganizationId: this.organizationId,
        Value: this.convertValue(property),
      },
    };

    this.placesService.GenericAPI(body).subscribe(() => {
      this.showToast(property.specificationName + ' updated');
      this.previousValues[property.id] = property.value;
    });
  }

  updateBooleanValue(property: any) {
    const body = {
      Name: 'InsertOrganizationSpecValue',
      Params: {
        RealEstateSpecificationId: property.id,
        OrganizationId: this.organizationId,
        Value: this.convertValue(property),
      },
    };

    this.placesService.GenericAPI(body).subscribe(() => {
      this.showToast(property.specificationName + ' updated');
    });
  }

  /* -----------------------------------------------------
     VALUE CONVERSION HELPERS
     ----------------------------------------------------- */
  convertValue(prop: any) {
    const type = (prop.specificationType || '').toLowerCase();

    if (['bool', 'boolean'].includes(type)) return prop.value === true;

    if (['double', 'float', 'decimal', 'number', 'int', 'integer'].includes(type)) {
      const num = Number(prop.value);
      return isNaN(num) ? null : num;
    }

    if (['date', 'datetime', 'timestamp'].includes(type)) {
      return prop.value ? prop.value.toString() : null;
    }

    return prop.value?.toString() || '';
  }

  /* -----------------------------------------------------
     TYPE HELPERS
     ----------------------------------------------------- */
  isBool(type: any) {
    return ['bool', 'boolean'].includes((type || '').toLowerCase());
  }

  isNumeric(type: any) {
    return ['double', 'float', 'decimal', 'number', 'int', 'integer']
      .includes((type || '').toLowerCase());
  }

  isDate(type: any) {
    return ['date', 'datetime', 'timestamp']
      .includes((type || '').toLowerCase());
  }

  isText(type: any) {
    return !this.isBool(type) && !this.isNumeric(type) && !this.isDate(type);
  }

  /* -----------------------------------------------------
     TOAST
     ----------------------------------------------------- */
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const msg = document.getElementById('toastMessage');
    if (!toast || !msg) return;

    msg.innerText = message;
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), 2000);
  }
  groupHasMatches(group: any[], searchText: string): boolean {
    if (!searchText) return true;
    const text = searchText.toLowerCase();
    return group.some(x =>
      x.specificationName.toLowerCase().includes(text)
    );
  }
  
}
