import { NavigationKey } from "@/types/input";
import { isForwardNavigationKey } from "@/types/guards";

let internalSeed = 100;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rescale(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return Math.round(toMin + (((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)));
}

export function roundUpToMultiple(value: number, multiple: number): number {
  return multiple <= 0 ? value : (Math.floor(value / multiple) + 1) * multiple;
}

export function roundDownToMultiple(value: number, multiple: number): number {
  return multiple <= 0 ? value : (Math.ceil(value / multiple) - 1) * multiple;
}

export function roundToTwoDecimalPlaces(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toSeconds(milliseconds: number): number {
  return roundToTwoDecimalPlaces(milliseconds / 1_000);
}

export function valuesAround<V>(center: number, count: number, isInBounds: (position: number) => boolean, at: (position: number) => V): V[] {
  if (count <= 0 || !isInBounds(center)) {
    return [];
  }
  const result = [at(center)];
  let i = 1;

  while (result.length < count) {
    const left = center - i;
    const right = center + i;
    const isLeftInBounds = isInBounds(left);
    const isRightInBounds = isInBounds(right);

    if (!isLeftInBounds && !isRightInBounds) {
      break;
    }

    if (isLeftInBounds) {
      result.push(at(left));
    }

    if (isRightInBounds && result.length < count) {
      result.push(at(right));
    }
    i += 1;
  }
  return result;
}

export function numbersAround(initial: number, count: number, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number[] {
  return valuesAround(initial, count, value => value >= min && value <= max, value => value).sort((a, b) => a - b);
}

export function numbersInRange(start: number, end: number): number[] {
  const result: number[] = [];

  for (let i = start; i <= end; i += 1) {
    result.push(i);
  }
  return result;
}

export function sum(numbers: number[]): number {
  return numbers.reduce((acc: number, n: number) => acc + n, 0);
}

export function average(numbers: number[]): number {
  return numbers.length === 0 ? 0 : sum(numbers) / numbers.length;
}

export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function randomIntInRange(min: number, max: number): number {
  return randomInt(max - min) + min;
}

export function randomFloatInRange(min: number, max: number): number {
  return min + (Math.random() * (max - min));
}

export function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

export function seededFloat(seed: number): number {
  const x = Math.sin(seed) * 4_051.2948;
  return x - Math.floor(x);
}

export function nextSeededInt(max: number): number {
  internalSeed += 1;
  return Math.floor(seededFloat(internalSeed) * max);
}

export function nextSeededIntInRange(min: number, max: number): number {
  return nextSeededInt(max - min) + min;
}

export function navigationDelta(direction: NavigationKey): number {
  return isForwardNavigationKey(direction) ? 1 : -1;
}
