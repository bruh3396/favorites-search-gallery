import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxZoomChipClass = {
  root: "fsg-LightboxZoomChip"
} as const;

export interface LightboxZoomChipProps {
  magnification: Readable<number | undefined>;
}

const ACTUAL_PIXELS_TOLERANCE = 2;

export function LightboxZoomChip({ magnification }: LightboxZoomChipProps): HTMLElement {
  return (
    <div className={LightboxZoomChipClass.root} hidden={computed(() => magnification.value === undefined)}>
      {computed(() => formatMagnification(magnification.value))}
    </div>
  );
}

function formatMagnification(magnification: number | undefined): string {
  if (magnification === undefined) {
    return "";
  }
  const percent = Math.round(magnification * 100);
  return Math.abs(percent - 100) < ACTUAL_PIXELS_TOLERANCE ? `${percent}% · actual pixels` : `${percent}%`;
}
