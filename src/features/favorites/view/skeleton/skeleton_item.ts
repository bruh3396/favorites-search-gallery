import { coinFlip, randomBetween, randomIntInRange, roundToTwoDecimalPlaces, seededRandomIntInRange } from "@/utils/number";
import { Dimensions2D } from "@/types/geometry";
import { Layout } from "@/types/ui";
import { SkeletonConfig } from "@/config/skeleton_config";
import { TILE_ITEM_CLASS_NAME } from "@/lib/thumb/thumbs";
import { parseDimensions2D } from "@/utils/string/parse";

export class FavoritesSkeletonItem {
  public readonly element: HTMLElement;

  constructor(layout: Layout, aspectRatio: string | undefined) {
    this.element = document.createElement("div");
    this.element.className = `skeleton-item ${TILE_ITEM_CLASS_NAME}`;
    this.setSize(layout, aspectRatio);
    this.configureAnimation();

  }

  private setSize(layout: Layout, aspectRatio: string | undefined): void {
    this.element.dataset.layout = layout;

    if (layout === "native") {
      const dimensions: Dimensions2D = aspectRatio ? parseDimensions2D(aspectRatio) : randomDimensions();

      this.element.style.setProperty("width", `${dimensions.x}px`);
      this.element.style.setProperty("height", `${dimensions.y}px`);
    } else {
      this.element.style.setProperty("aspect-ratio", aspectRatio ?? randomAspectRatio());
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
  return roundToTwoDecimalPlaces(randomBetween(min, max));
}

function randomAnimationDuration(): number {
  const { min, max } = SkeletonConfig.animationDurationRange;
  return roundToTwoDecimalPlaces(randomBetween(min, max));
}

function randomAspectRatio(): string {
  const {
    fallbackAspectRatioWidth: w,
    fallbackAspectRatioHeightMin: hMin,
    fallbackAspectRatioHeightMax: hMax
  } = SkeletonConfig;
  return `${w}/${seededRandomIntInRange(hMin, hMax)}`;
}

function randomDimensions(): Dimensions2D {
  const {
    discreteDimensionMin: min,
    discreteDimensionMax: max
  } = SkeletonConfig;

  const maximizeWidth = coinFlip();
  const randomDimension = randomIntInRange(min, max);
  return {
    x: maximizeWidth ? max : randomDimension,
    y: maximizeWidth ? randomDimension : max
  };
}
