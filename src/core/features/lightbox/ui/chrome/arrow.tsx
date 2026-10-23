import { createLightboxIcon } from "@/core/features/lightbox/ui/chrome/icon";
import { h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  plate: "fsg-LightboxArrow-plate",
  icon: "fsg-LightboxArrow-icon"
} as const;

export type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  onClick: () => void;
}

const LABELS: Readonly<Record<LightboxArrowDirection, string>> = { previous: "Previous", next: "Next" };

export function LightboxArrow({ direction, onClick }: LightboxArrowProps): HTMLElement {
  const plate = (<span className={LightboxArrowClass.plate} />) as HTMLElement;

  plate.append(createLightboxIcon(plate.ownerDocument, direction, LightboxArrowClass.icon));
  return (
    <button className={LightboxArrowClass.root} type="button" aria-label={LABELS[direction]} title={LABELS[direction]} onClick={() => onClick()}>
      {plate}
    </button>
  ) as HTMLElement;
}
