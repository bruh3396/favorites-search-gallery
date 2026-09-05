import { clamp, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { Preferences } from "@/app/context/preferences";

export function toggleBackgroundOpacity(): void {
  Preferences.gallery.backgroundOpacity.set(Preferences.gallery.backgroundOpacity.value < 1 ? 1 : 0);
}

export function updateBackgroundOpacity(event: WheelEvent): void {
  Preferences.gallery.backgroundOpacity.set(roundToTwoDecimalPlaces(computeOpacity(event)));
}

function computeOpacity(event: WheelEvent): number {
  return clamp(Preferences.gallery.backgroundOpacity.value - (event.deltaY * 0.0005), 0, 1);
}
