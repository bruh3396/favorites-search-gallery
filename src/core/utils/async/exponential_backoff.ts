import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

export interface ExponentialBackoffConfiguration {
  readonly baseDelay: number;
  readonly maxDelay?: number;
}

export function createExponentialBackoff(
  { baseDelay, maxDelay = Infinity }: ExponentialBackoffConfiguration,
  randomSource: RandomSource
): (failureCount: number) => number {
  return failureCount => randomSource.next() * Math.min(baseDelay * (2 ** (failureCount - 1)), maxDelay);
}
