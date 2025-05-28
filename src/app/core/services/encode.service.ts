import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncodeService {
  private readonly alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private readonly radix = BigInt(this.alphabet.length);


  encode(data: Uint8Array): string {

    let value = BigInt(0);
    for (const b of data) {
      value = (value << BigInt(8)) | BigInt(b);
    }


    if (value === BigInt(0)) {
      return this.alphabet[0];
    }


    const chars: string[] = [];
    while (value > 0) {
      const rem = Number(value % this.radix);
      chars.unshift(this.alphabet[rem]);
      value /= this.radix;
    }


    let leadingZeros = 0;
    for (const b of data) {
      if (b === 0) leadingZeros++;
      else break;
    }
    if (leadingZeros) {
      chars.unshift(this.alphabet[0].repeat(leadingZeros));
    }

    return chars.join('');
  }
}
