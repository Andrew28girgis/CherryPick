import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DecodeService {
  private readonly alphabet = 
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private readonly radix = BigInt(this.alphabet.length);
  private readonly alphabetMap: Map<string, bigint>;

  constructor() {
    this.alphabetMap = new Map();
    for (let i = 0; i < this.alphabet.length; i++) {
      this.alphabetMap.set(this.alphabet[i], BigInt(i));
    }
  }

  decode(encoded: string): Uint8Array {
    if (!encoded) {
      return new Uint8Array(0);
    }

    // Count leading zeros
    let leadingZeros = 0;
    while (encoded[leadingZeros] === this.alphabet[0] && leadingZeros < encoded.length) {
      leadingZeros++;
    }

    // Process the rest of the string
    let value = BigInt(0);
    for (let i = leadingZeros; i < encoded.length; i++) {
      const char = encoded[i];
      const digit = this.alphabetMap.get(char);
      if (digit === undefined) {
        throw new Error(`Invalid character in encoded string: ${char}`);
      }
      value = value * this.radix + digit;
    }

    // Convert BigInt to bytes
    const bytes: number[] = [];
    while (value > 0) {
      bytes.unshift(Number(value & BigInt(0xff)));
      value = value >> BigInt(8);
    }

    // Add leading zeros if any
    while (bytes.length < leadingZeros) {
      bytes.unshift(0);
    }

    return new Uint8Array(bytes);
  }

  // Helper method to decode to string (UTF-8)
  decodeToString(encoded: string): string {
    const bytes = this.decode(encoded);
    return new TextDecoder('utf-8').decode(bytes);
  }
}