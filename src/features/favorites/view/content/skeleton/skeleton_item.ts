import { getSeededRandomPositiveIntegerInRange, roundToTwoDecimalPlaces } from "../../../../../utils/primitive/number";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { ITEM_CLASS_NAME } from "../../../../../utils/dom/dom";
import { getNextAspectRatio } from "./aspect_ratios";

function getRandomAnimationDelay(): number {
  return roundToTwoDecimalPlaces(Math.random() * 0.1);
}

function getRandomAnimationDuration(): number {
  return roundToTwoDecimalPlaces((Math.random()) + 0.7);
}

function getPredictedAspectRatio(): string {
  return getNextAspectRatio() || `10/${getSeededRandomPositiveIntegerInRange(5, 20)}`;
}

export class SkeletonItem {
  public readonly element: HTMLElement;

  constructor(style: Record<string, string>) {
    this.element = document.createElement("div");
    this.setStyle(style);
  }

  private setStyle(style: Record<string, string>): void {
    this.setAspectRatio();
    this.setAnimation();
    this.setCustomStyle(style);
    this.setClassName();
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
