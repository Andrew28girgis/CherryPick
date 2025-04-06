import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortBy'
})

export class SortByPipe implements PipeTransform {
  transform(tenants: any[]): any[] {
    if (!tenants) return [];
    return tenants.sort((a, b) => a.Name.localeCompare(b.Name));
  }
}