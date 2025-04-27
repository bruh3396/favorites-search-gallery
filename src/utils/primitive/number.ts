export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRandomPositiveInteger(maximum: number): number {
  return Math.floor(Math.random() * maximum);
}

export function getRandomPositiveIntegerInRange(min: number, max: number): number {
  return getRandomPositiveInteger(max - min) + min;
}

export function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return Math.round(toMin + (((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)));
}
