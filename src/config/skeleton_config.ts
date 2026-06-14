type SkeletonAnimation = "shimmer" | "pulse"

export const SkeletonConfig = {
  defaultItemCount: 50,

  fallbackAspectRatioWidth: 10,
  fallbackAspectRatioHeightMin: 5,
  fallbackAspectRatioHeightMax: 20,
  discreteDimensionMin: 125,
  discreteDimensionMax: 250,

  animation: "pulse" satisfies SkeletonAnimation,
  randomAnimationTiming: true,
  animationDelayRange: { min: 0, max: 0.15 },
  animationDurationRange: { min: 0.55, max: 0.85 }
};
