import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

export function randomInt(randomSource: RandomSource, max: number): number {
  return Math.floor(randomSource.next() * max);
}

export function randomIntInRange(randomSource: RandomSource, min: number, max: number): number {
  return randomInt(randomSource, max - min) + min;
}

export function randomFloatInRange(randomSource: RandomSource, min: number, max: number): number {
  return min + (randomSource.next() * (max - min));
}

export function randomBoolean(randomSource: RandomSource): boolean {
  return randomSource.next() < 0.5;
}

export function seededFloat(seed: number): number {
  const x = Math.sin(seed) * 4_051.2948;
  return x - Math.floor(x);
}

export function shuffleInPlace<V>(randomSource: RandomSource, array: V[]): V[] {
  let maxIndex = array.length;
  let randomIndex;

  while (maxIndex > 0) {
    randomIndex = randomInt(randomSource, maxIndex);
    maxIndex -= 1;
    [array[maxIndex], array[randomIndex]] = [array[randomIndex], array[maxIndex]];
  }
  return array;
}
