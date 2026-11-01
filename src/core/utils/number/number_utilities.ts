import { NumberRange } from "@/core/utils/number/number_range";
import { getNeighborhoodValues } from "@/core/utils/number/neighborhood";

const ALL_NON_NEGATIVE: NumberRange = { min: 0, max: Number.MAX_SAFE_INTEGER };

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rescale(value: number, fromNumberRange: NumberRange, toNumberRange: NumberRange): number {
  return Math.round(toNumberRange.min +
    (((value - fromNumberRange.min) / (fromNumberRange.max - fromNumberRange.min)) * (toNumberRange.max - toNumberRange.min)));
}

export function rescaleGeometric(value: number, fromNumberRange: NumberRange, toNumberRange: NumberRange): number {
  const t = (value - fromNumberRange.min) / (fromNumberRange.max - fromNumberRange.min);
  return Math.round(toNumberRange.min * ((toNumberRange.max / toNumberRange.min) ** t));
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

export function daysToMilliseconds(days: number): number {
  return days * 24 * 60 * 60 * 1_000;
}

export function getNumbersAround(initial: number, count: number, { min, max }: NumberRange = ALL_NON_NEGATIVE): number[] {
  return getNeighborhoodValues(initial, count, {
    isInBounds: value => value >= min && value <= max,
    at: value => value
  }).sort((a, b) => a - b);
}

export function getNumbersInRange(start: number, end: number): number[] {
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

export function hashInt(value: number, seed: number): number {
  let hash = (value ^ seed) >>> 0;

  hash = Math.imul(hash ^ (hash >>> 16), 0x85_eb_ca_6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2_b2_ae_35);
  return (hash ^ (hash >>> 16)) >>> 0;
}
