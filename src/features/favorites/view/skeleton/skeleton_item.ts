import { randomBoolean, randomFloatInRange, randomIntInRange, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { Dimensions2D } from "@/types/geometry";
import { Layout } from "@/types/app";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";
import { TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { toDimensions2D } from "@/utils/pure/geometry";

export class FavoritesSkeletonItem {
  public readonly element: HTMLElement;

  constructor(layout: Layout, aspectRatio: string | undefined, fallbackAspectRatioHeights: SeededSequence) {
    this.element = document.createElement("div");
    this.element.className = `skeleton-item ${TILE_CLASS_NAME}`;
    this.setSize(layout, aspectRatio, fallbackAspectRatioHeights);
    this.configureAnimation();

  }

  private setSize(layout: Layout, aspectRatio: string | undefined, fallbackAspectRatioHeights: SeededSequence): void {
    this.element.dataset.layout = layout;

    if (layout === "native") {
      const dimensions: Dimensions2D = aspectRatio ? toDimensions2D(aspectRatio) : randomDimensions();

      this.element.style.setProperty("width", `${dimensions.width}px`);
      this.element.style.setProperty("height", `${dimensions.height}px`);
    } else {
      this.element.style.setProperty("aspect-ratio", aspectRatio ?? randomAspectRatio(fallbackAspectRatioHeights));
    }
  }

  private configureAnimation(): void {
    if (SkeletonConfig.randomAnimationTiming) {
      this.element.style.setProperty("--delay-skeleton", `${randomAnimationDelay()}s`);
      this.element.style.setProperty("--duration-skeleton", `${randomAnimationDuration()}s`);
    }
    this.element.dataset.animation = SkeletonConfig.animation;
  }
}

function randomAnimationDelay(): number {
  const { min, max } = SkeletonConfig.animationDelayRange;
  return roundToTwoDecimalPlaces(randomFloatInRange(min, max));
}

function randomAnimationDuration(): number {
  const { min, max } = SkeletonConfig.animationDurationRange;
  return roundToTwoDecimalPlaces(randomFloatInRange(min, max));
}

function randomAspectRatio(fallbackAspectRatioHeights: SeededSequence): string {
  const {
    fallbackAspectRatioWidth: w,
    fallbackAspectRatioHeightMin: hMin,
    fallbackAspectRatioHeightMax: hMax
  } = SkeletonConfig;
  return `${w}/${fallbackAspectRatioHeights.nextInRange(hMin, hMax)}`;
}

function randomDimensions(): Dimensions2D {
  const {
    discreteDimensionMin: min,
    discreteDimensionMax: max
  } = SkeletonConfig;

  const shouldMaximizeWidth = randomBoolean();
  const randomDimension = randomIntInRange(min, max);
  return {
    width: shouldMaximizeWidth ? max : randomDimension,
    height: shouldMaximizeWidth ? randomDimension : max
  };
}
