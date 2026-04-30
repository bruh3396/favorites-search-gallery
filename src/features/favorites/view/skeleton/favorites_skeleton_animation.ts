import { randomBetween, roundToTwoDecimalPlaces } from "../../../../utils/number";

export function getRandomAnimationDelay(): number {
  return roundToTwoDecimalPlaces(randomBetween(0, 0.15));
}

export function getRandomAnimationDuration(): number {
  return roundToTwoDecimalPlaces(randomBetween(0.55, 0.85));
}
