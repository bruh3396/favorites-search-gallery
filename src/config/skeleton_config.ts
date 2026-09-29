type SkeletonAnimation = "shimmer" | "pulse";

export const SkeletonConfig = {
  defaultItemCount: 50,

  fallbackAspectRatioWidth: 10,
  fallbackAspectRatioHeightMin: 5,
  fallbackAspectRatioHeightMax: 20,
  discreteDimensionMin: 125,
  discreteDimensionMax: 250,

  animation: "pulse" satisfies SkeletonAnimation,
  randomAnimationTiming: true,
  animationDelayRangeSeconds: { min: 0, max: 0.15 },
  animationDurationRangeSeconds: { min: 0.55, max: 0.85 }
};
