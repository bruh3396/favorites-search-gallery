import { seededFloat } from "@/utils/pure/number";

export class SeededSequence {
  private seed = 100;

  public nextInRange(min: number, max: number): number {
    return this.next(max - min) + min;
  }

  private next(max: number): number {
    this.seed += 1;
    return Math.floor(seededFloat(this.seed) * max);
  }
}
