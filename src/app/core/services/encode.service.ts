import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncodeService {
  private readonly alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private readonly radix = BigInt(this.alphabet.length);

  /**
   * Encode a byte array (Uint8Array) into a Base62 string.
   */
  encode(data: Uint8Array): string {
    // 1) bytes → single BigInt
    let value = BigInt(0);
    for (const b of data) {
      value = (value << BigInt(8)) | BigInt(b);
    }

    // 2) special-case zero
    if (value === BigInt(0)) {
      return this.alphabet[0];
    }

    // 3) collect Base62 digits
    const chars: string[] = [];
    while (value > 0) {
      const rem = Number(value % this.radix);
      chars.unshift(this.alphabet[rem]);
      value /= this.radix;
    }

    // 4) preserve leading zero bytes
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
