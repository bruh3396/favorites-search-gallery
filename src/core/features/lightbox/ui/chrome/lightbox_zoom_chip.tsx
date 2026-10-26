import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

const ACTUAL_PIXELS_TOLERANCE = 2;

export const LightboxZoomChipClass = {
  root: "fsg-LightboxZoomChip"
} as const;

export interface LightboxZoomChipProps {
  pixelScale: Readable<number | undefined>;
}

export function LightboxZoomChip({ pixelScale }: LightboxZoomChipProps): HTMLElement {
  return (
    <span className={LightboxZoomChipClass.root} hidden={computed(() => pixelScale.value === undefined)}>
      {computed(() => formatPixelScale(pixelScale.value))}
    </span>
  ) as HTMLElement;
}

function formatPixelScale(pixelScale: number | undefined): string {
  if (pixelScale === undefined) {
    return "";
  }
  const percent = Math.round(pixelScale * 100);
  return Math.abs(percent - 100) < ACTUAL_PIXELS_TOLERANCE ? `${percent}% · actual pixels` : `${percent}%`;
}
