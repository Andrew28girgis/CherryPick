import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberWithCommas'
})
export class NumberWithCommasPipe implements PipeTransform {
  transform(value: number | null): string {
    return value !== null ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  }
}
