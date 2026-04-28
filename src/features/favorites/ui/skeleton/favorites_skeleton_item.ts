import { getPredictedAspectRatio, getPredictedDiscreteDimensions } from "./favorites_skeleton_dimensions";
import { getRandomAnimationDelay, getRandomAnimationDuration } from "./favorites_skeleton_animation";
import { GeneralSettings } from "../../../../config/general_settings";
import { LayoutMode } from "../../../../types/common_types";
import { getSkeletonStyle } from "./favorites_skeleton_style";

export class SkeletonItem {
  public readonly element: HTMLElement;

  constructor(layout: LayoutMode) {
    this.element = document.createElement("div");
    this.setStyle(getSkeletonStyle(layout));
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

    this.element.style.setProperty("width", `${dimensions.x}px`);
    this.element.style.setProperty("height", `${dimensions.y}px`);
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
