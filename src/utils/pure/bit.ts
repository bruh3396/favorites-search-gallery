export function bitWidth(count: number): number {
  let bits = 0;

  while ((1 << bits) < count) {
    bits += 1;
  }
  return bits;
}

export function packIntArray(values: Uint16Array | Uint32Array, length: number, bitsPerValue: number): Uint8Array {
  const packed = new Uint8Array(Math.ceil((length * bitsPerValue) / 8));

  for (let i = 0; i < length; i += 1) {
    writeBits(packed, i * bitsPerValue, bitsPerValue, values[i]);
  }
  return packed;
}

export function readPackedInt(packed: Uint8Array, index: number, bitsPerValue: number): number {
  return readBits(packed, index * bitsPerValue, bitsPerValue);
}

function writeBits(bytes: Uint8Array, bitOffset: number, bitCount: number, value: number): void {
  for (let i = 0; i < bitCount; i += 1) {
    if (((value >>> i) & 1) === 1) {
      const position = bitOffset + i;

      bytes[position >>> 3] |= 1 << (position & 7);
    }
  }
}

function readBits(bytes: Uint8Array, bitOffset: number, bitCount: number): number {
  let value = 0;

  for (let i = 0; i < bitCount; i += 1) {
    const position = bitOffset + i;
    const bit = (bytes[position >>> 3] >>> (position & 7)) & 1;

    value |= bit << i;
  }
  return value >>> 0;
}
