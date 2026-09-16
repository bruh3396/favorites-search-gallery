import { clamp, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryBackgroundFlow extends GalleryFlow {
  public toggleBackgroundOpacity(): void {
    this.context.preferences.gallery.backgroundOpacity.set(this.context.preferences.gallery.backgroundOpacity.value < 1 ? 1 : 0);
  }

  public updateBackgroundOpacity(event: WheelEvent): void {
    this.context.preferences.gallery.backgroundOpacity.set(roundToTwoDecimalPlaces(this.computeOpacity(event)));
  }

  private computeOpacity(event: WheelEvent): number {
    return clamp(this.context.preferences.gallery.backgroundOpacity.value - (event.deltaY * 0.0005), 0, 1);
  }
}
