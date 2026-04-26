import { getPredictedAspectRatio, getPredictedDiscreteDimensions } from "./favorites_skeleton_dimensions";
import { getRandomAnimationDelay, getRandomAnimationDuration } from "./favorites_skeleton_animation";
import { GeneralSettings } from "../../../../config/general_settings";

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
    if (GeneralSettings.randomSkeletonAnimationTiming) {
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
    this.element.className = `skeleton-item favorite ${GeneralSettings.skeletonAnimationClasses}`;
  }
}
