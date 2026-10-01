import { Random } from "@/core/boundary/ports/random";

export class BrowserRandom implements Random {
  public next(): number {
    return Math.random();
  }
}
