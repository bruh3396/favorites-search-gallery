import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

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
  return `${Math.round(pixelScale * 100)}%`;
}
