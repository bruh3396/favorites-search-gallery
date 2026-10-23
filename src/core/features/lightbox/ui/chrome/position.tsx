import { Readable, computed } from "@/core/utils/reactive/signal";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export const LightboxPositionClass = {
  root: "fsg-LightboxPosition"
} as const;

export interface LightboxPositionProps {
  position: Readable<SequencePosition | undefined>;
}

export function LightboxPosition({ position }: LightboxPositionProps): HTMLElement {
  return <span className={LightboxPositionClass.root}>{computed(() => formatPosition(position.value))}</span>;
}

function formatPosition(position: SequencePosition | undefined): string {
  if (position === undefined) {
    return "";
  }
  const shown = (position.index + 1).toLocaleString();
  return position.total === undefined ? shown : `${shown} / ${position.total.toLocaleString()}`;
}
