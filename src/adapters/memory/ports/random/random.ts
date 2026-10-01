import { Random } from "@/core/boundary/ports/random";

export class MemoryRandom implements Random {
  private readonly values: readonly number[];
  private index = 0;

  constructor(values: readonly number[] = [0]) {
    this.values = values;
  }

  public next(): number {
    const value = this.values[this.index % this.values.length];

    this.index += 1;
    return value;
  }
}
