import { Readable, computed } from "@/core/utils/reactive/signal";
import { MediaSequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export const LightboxPositionClass = {
  root: "fsg-LightboxPosition"
} as const;

export interface LightboxPositionProps {
  position: Readable<MediaSequencePosition | undefined>;
}

export function LightboxPosition({ position }: LightboxPositionProps): HTMLElement {
  return <span className={LightboxPositionClass.root}>{computed(() => formatPosition(position.value))}</span> as HTMLElement;
}

function formatPosition(mediaSequencePosition: MediaSequencePosition | undefined): string {
  if (mediaSequencePosition === undefined) {
    return "";
  }
  const shown = (mediaSequencePosition.index + 1).toLocaleString();
  return mediaSequencePosition.total === undefined ? shown : `${shown} / ${mediaSequencePosition.total.toLocaleString()}`;
}
