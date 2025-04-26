export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRandomPositiveInteger(maximum: number): number {
  return Math.floor(Math.random() * maximum);
}
