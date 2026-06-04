import { coinFlip, randomIntInRange, seededRandomIntInRange } from "@/utils/number";
import { getRandomAnimationDelay, getRandomAnimationDuration } from "@/features/favorites/view/skeleton/skeleton_animation";
import { Dimensions2D } from "@/types/geometry";
import { Layout } from "@/types/ui";
import { SkeletonConfig } from "@/config/skeleton_config";
import { getSkeletonStyle } from "@/features/favorites/view/skeleton/skeleton_style";
import { parseDimensions2D } from "@/utils/string/parse";

export class SkeletonItem {
  public readonly element: HTMLElement;

  constructor(layout: Layout, aspectRatio: string | undefined) {
    this.element = document.createElement("div");
    this.element.className = "skeleton-item post";
    this.setSize(getSkeletonStyle(layout), aspectRatio);
    this.configureAnimation();

  }

  private setSize(style: Record<string, string> | null, aspectRatio: string | undefined): void {
    if (style === null) {
      const dimensions: Dimensions2D = aspectRatio ? parseDimensions2D(aspectRatio) : randomDimensions();

      this.element.style.setProperty("width", `${dimensions.x}px`);
      this.element.style.setProperty("height", `${dimensions.y}px`);
    } else {
      this.element.style.setProperty("aspect-ratio", aspectRatio ?? randomAspectRatio());
      Object.entries(style).forEach(([key, value]) => this.element.style.setProperty(key, value));
    }
  }

    private configureAnimation(): void {
    if (SkeletonConfig.randomAnimationTiming) {
      this.element.style.setProperty("--delay-skeleton", `${getRandomAnimationDelay()}s`);
      this.element.style.setProperty("--duration-skeleton", `${getRandomAnimationDuration()}s`);
    }
    this.element.dataset.animation = SkeletonConfig.animation;
  }
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
