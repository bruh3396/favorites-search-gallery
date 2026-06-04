import { randomBetween, roundToTwoDecimalPlaces } from "@/utils/number";
import { SkeletonConfig } from "@/config/skeleton_config";

export function getRandomAnimationDelay(): number {
  const { min, max } = SkeletonConfig.animationDelayRange;
  return roundToTwoDecimalPlaces(randomBetween(min, max));
}

export function getRandomAnimationDuration(): number {
  const { min, max } = SkeletonConfig.animationDurationRange;
  return roundToTwoDecimalPlaces(randomBetween(min, max));
}
