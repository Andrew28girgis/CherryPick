import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortBy'
})
export class SortByPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) {
      return array;
    }
    return array.sort((a: any, b: any) => {
      if (a[field].toLowerCase() < b[field].toLowerCase()) return -1;
      if (a[field].toLowerCase() > b[field].toLowerCase()) return 1;
      return 0;
    });
  }

}
