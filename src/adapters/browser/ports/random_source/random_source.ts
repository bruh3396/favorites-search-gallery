import { RandomSource } from "@/core/boundary/ports/random_source";

export class BrowserRandomSource implements RandomSource {
  public next(): number {
    return Math.random();
  }
}
