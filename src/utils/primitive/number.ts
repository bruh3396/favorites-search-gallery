let internalSeed = 100;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRandomPositiveInteger(maximum: number): number {
  return Math.floor(Math.random() * maximum);
}

export function getRandomPositiveIntegerInRange(min: number, max: number): number {
  return getRandomPositiveInteger(max - min) + min;
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 4051.2948;
  return x - Math.floor(x);
}

export function getSeededRandomPositiveInteger(maximum: number): number {
  internalSeed += 1;
  return Math.floor(seededRandom(internalSeed) * maximum);
}

export function getSeededRandomPositiveIntegerInRange(min: number, max: number): number {
  return getSeededRandomPositiveInteger(max - min) + min;
}

export function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return Math.round(toMin + (((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)));
}

export function roundToTwoDecimalPlaces(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
