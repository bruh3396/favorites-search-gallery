import { randomBoolean, randomFloatInRange, randomIntInRange, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { Dimensions2D } from "@/types/geometry";
import { Layout } from "@/types/app";
import { RandomSource } from "@/core/boundary/ports/random_source";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";
import { TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { toDimensions2D } from "@/utils/pure/geometry";

export class FavoritesSkeletonItem {
  public readonly element: HTMLElement;

  constructor(randomSource: RandomSource, layout: Layout, aspectRatio: string | undefined, fallbackAspectRatioHeights: SeededSequence) {
    this.element = document.createElement("div");
    this.element.className = `skeleton-item ${TILE_CLASS_NAME}`;
    this.setSize(randomSource, layout, aspectRatio, fallbackAspectRatioHeights);
    this.configureAnimation(randomSource);

  }

  private setSize(randomSource: RandomSource, layout: Layout, aspectRatio: string | undefined, fallbackAspectRatioHeights: SeededSequence): void {
    this.element.dataset.layout = layout;

    if (layout === "native") {
      const dimensions: Dimensions2D = aspectRatio ? toDimensions2D(aspectRatio) : randomDimensions(randomSource);

      this.element.style.setProperty("width", `${dimensions.width}px`);
      this.element.style.setProperty("height", `${dimensions.height}px`);
    } else {
      this.element.style.setProperty("aspect-ratio", aspectRatio ?? randomAspectRatio(fallbackAspectRatioHeights));
    }
  }

  private configureAnimation(randomSource: RandomSource): void {
    if (SkeletonConfig.randomAnimationTiming) {
      this.element.style.setProperty("--delay-skeleton", `${randomAnimationDelay(randomSource)}s`);
      this.element.style.setProperty("--duration-skeleton", `${randomAnimationDuration(randomSource)}s`);
    }
    this.element.dataset.animation = SkeletonConfig.animation;
  }
}

function randomAnimationDelay(randomSource: RandomSource): number {
  const { min, max } = SkeletonConfig.animationDelayRangeSeconds;
  return roundToTwoDecimalPlaces(randomFloatInRange(randomSource, min, max));
}

function randomAnimationDuration(randomSource: RandomSource): number {
  const { min, max } = SkeletonConfig.animationDurationRangeSeconds;
  return roundToTwoDecimalPlaces(randomFloatInRange(randomSource, min, max));
}

function randomAspectRatio(fallbackAspectRatioHeights: SeededSequence): string {
  const {
    fallbackAspectRatioWidth: w,
    fallbackAspectRatioHeightMin: hMin,
    fallbackAspectRatioHeightMax: hMax
  } = SkeletonConfig;
  return `${w}/${fallbackAspectRatioHeights.nextInRange(hMin, hMax)}`;
}

function randomDimensions(randomSource: RandomSource): Dimensions2D {
  const {
    discreteDimensionMin: min,
    discreteDimensionMax: max
  } = SkeletonConfig;

  const shouldMaximizeWidth = randomBoolean(randomSource);
  const randomDimension = randomIntInRange(randomSource, min, max);
  return {
    width: shouldMaximizeWidth ? max : randomDimension,
    height: shouldMaximizeWidth ? randomDimension : max
  };
}
