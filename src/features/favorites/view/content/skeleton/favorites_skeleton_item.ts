import { getRandomPositiveIntegerInRange, getSeededRandomPositiveIntegerInRange, randomBetween, roundToTwoDecimalPlaces } from "../../../../../utils/primitive/number";
import { Dimensions2D } from "../../../../../types/common_types";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { ITEM_CLASS_NAME } from "../../../../../utils/dom/dom";
import { getDimensions2D } from "../../../../../utils/primitive/string";
import { getNextAspectRatio } from "./favorites_aspect_ratio_collector";

function getRandomAnimationDelay(): number {
  return roundToTwoDecimalPlaces(randomBetween(0, 0.3));
}

function getRandomAnimationDuration(): number {
  return roundToTwoDecimalPlaces(randomBetween(0.75, 1.5));
}

function getPredictedAspectRatio(): string {
  return getNextAspectRatio() ?? `10/${getSeededRandomPositiveIntegerInRange(5, 20)}`;
}

function getPredictedDiscreteDimensions(): Dimensions2D {
  const aspectRatio = getNextAspectRatio();

  if (aspectRatio !== undefined) {
    return getDimensions2D(aspectRatio);
  }
  const maximizeWidth = Math.random() < 0.5;
  const randomDimension = getRandomPositiveIntegerInRange(125, 250);
  return { width: maximizeWidth ? 250 : randomDimension, height: maximizeWidth ? randomDimension : 250};
}

export class SkeletonItem {
  public readonly element: HTMLElement;

  constructor(style: Record<string, string>) {
    this.element = document.createElement("div");
    this.setStyle(style);
  }

  private setStyle(style: Record<string, string>): void {
    if (Object.keys(style).includes("native")) {
      this.setDiscreteDimensions();
    } else {
      this.setAspectRatio();
      this.setCustomStyle(style);
    }
    this.setAnimation();
    this.setClassName();
  }

  private setDiscreteDimensions(): void {
    const dimensions = getPredictedDiscreteDimensions();

    this.element.style.setProperty("width", `${dimensions.width}px`);
    this.element.style.setProperty("height", `${dimensions.height}px`);
  }

  private setAnimation(): void {
    if (FavoritesSettings.randomSkeletonAnimationTiming) {
      this.element.style.setProperty("--skeleton-animation-delay", `${getRandomAnimationDelay()}s`);
      this.element.style.setProperty("--skeleton-animation-duration", `${getRandomAnimationDuration()}s`);
    }
  }

  private setAspectRatio(): void {
    this.element.style.setProperty("aspect-ratio", getPredictedAspectRatio());
  }

  private setCustomStyle(style: Record<string, string>): void {
    for (const [key, value] of Object.entries(style)) {
      this.element.style.setProperty(key, value);
    }
  }

  private setClassName(): void {
    this.element.className = `skeleton-item ${ITEM_CLASS_NAME} ${FavoritesSettings.skeletonAnimationClasses}`;
  }
}
