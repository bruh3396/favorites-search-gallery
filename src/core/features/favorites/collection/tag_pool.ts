import { grow } from "@/core/utils/collection/array_utilities";
import { StringInterner } from "@/core/utils/string/string_interner";

const INITIAL_SLOT_COUNT = 1_024;
const INITIAL_TAG_COUNT = 1_024;

export class TagPool {
  private packedIds: Uint8Array | null = null;
  private ids: Uint16Array | Uint32Array = new Uint16Array(INITIAL_TAG_COUNT);
  private offsets = new Uint32Array(INITIAL_SLOT_COUNT);
  private counts = new Uint16Array(INITIAL_SLOT_COUNT);
  private vocabulary: Map<string, number> | null = new Map<string, number>();
  private readonly reversedVocabulary: string[] = [];
  private bitsPerId = 0;
  private tagsLength = 0;
  private vocabularyLength = 0;

  constructor(private readonly stringInterner: StringInterner) { }

  public write(slot: number, tagNames: readonly string[]): void {
    this.ensureCapacity(slot + 1);

    if (this.packedIds !== null) {
      this.unpackIds(this.packedIds);
    }
    const vocabulary = this.vocabulary ?? this.rebuildVocabulary();

    this.offsets[slot] = this.tagsLength;
    this.counts[slot] = tagNames.length;
    this.ensureTagCapacity(this.tagsLength + tagNames.length);

    for (const tagName of tagNames) {
      let id = vocabulary.get(tagName);

      if (id === undefined) {
        this.promoteIds();
        id = this.vocabularyLength;
        vocabulary.set(this.stringInterner.intern(tagName), id);
        this.reversedVocabulary.push(this.stringInterner.intern(tagName));
        this.vocabularyLength += 1;
      }
      this.ids[this.tagsLength] = id;
      this.tagsLength += 1;
    }
  }

  public read(slot: number): string[] {
    const offset = this.offsets[slot];
    const count = this.counts[slot];
    const tagNames: string[] = [];

    for (let i = 0; i < count; i += 1) {
      tagNames.push(this.reversedVocabulary[this.readId(offset + i)]);
    }
    return tagNames;
  }

  public trim(count: number): void {
    if (count === this.offsets.length) {
      return;
    }
    this.offsets = this.offsets.slice(0, count);
    this.counts = this.counts.slice(0, count);
  }

  public compact(): void {
    this.packIds();
    this.vocabulary = null;
  }

  private ensureCapacity(required: number): void {
    if (required <= this.offsets.length) {
      return;
    }

    const capacity = Math.max(this.offsets.length * 2, required);

    this.offsets = grow(this.offsets, capacity);
    this.counts = grow(this.counts, capacity);
  }

  private rebuildVocabulary(): Map<string, number> {
    const vocabulary = new Map<string, number>();

    for (let id = 0; id < this.reversedVocabulary.length; id += 1) {
      vocabulary.set(this.reversedVocabulary[id], id);
    }
    this.vocabulary = vocabulary;
    return vocabulary;
  }

  private readId(index: number): number {
    return this.packedIds === null ? this.ids[index] : readPackedInt(this.packedIds, index, this.bitsPerId);
  }

  private packIds(): void {
    this.bitsPerId = Math.max(1, getBitWidth(this.vocabularyLength));
    this.packedIds = packIntArray(this.ids, this.tagsLength, this.bitsPerId);
    this.ids = new Uint16Array(0);
  }

  private unpackIds(packedIds: Uint8Array): void {
    const restored = this.vocabularyLength >= 65_536 ? new Uint32Array(this.tagsLength) : new Uint16Array(this.tagsLength);

    for (let i = 0; i < this.tagsLength; i += 1) {
      restored[i] = readPackedInt(packedIds, i, this.bitsPerId);
    }
    this.ids = restored;
    this.packedIds = null;
    this.bitsPerId = 0;
  }

  private ensureTagCapacity(required: number): void {
    if (required <= this.ids.length) {
      return;
    }

    let newLength = this.ids.length * 2;

    while (newLength < required) {
      newLength *= 2;
    }
    this.ids = grow(this.ids, newLength);
  }

  private promoteIds(): void {
    if (this.ids instanceof Uint16Array && this.vocabularyLength >= 65_536) {
      const next = new Uint32Array(this.ids.length);

      next.set(this.ids);
      this.ids = next;
    }
  }
}

interface BitSpan {
  readonly offset: number;
  readonly count: number;
}

function getBitWidth(count: number): number {
  let bits = 0;

  while ((1 << bits) < count) {
    bits += 1;
  }
  return bits;
}

function packIntArray(values: Uint16Array | Uint32Array, length: number, bitsPerValue: number): Uint8Array {
  const packed = new Uint8Array(Math.ceil((length * bitsPerValue) / 8));

  for (let i = 0; i < length; i += 1) {
    writeBits(packed, { offset: i * bitsPerValue, count: bitsPerValue }, values[i]);
  }
  return packed;
}

function readPackedInt(packed: Uint8Array, index: number, bitsPerValue: number): number {
  return readBits(packed, { offset: index * bitsPerValue, count: bitsPerValue });
}

function writeBits(bytes: Uint8Array, { offset, count }: BitSpan, value: number): void {
  for (let i = 0; i < count; i += 1) {
    if (((value >>> i) & 1) === 1) {
      const position = offset + i;

      bytes[position >>> 3] |= 1 << (position & 7);
    }
  }
}

function readBits(bytes: Uint8Array, { offset, count }: BitSpan): number {
  let value = 0;

  for (let i = 0; i < count; i += 1) {
    const position = offset + i;
    const bit = (bytes[position >>> 3] >>> (position & 7)) & 1;

    value |= bit << i;
  }
  return value >>> 0;
}
