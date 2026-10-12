import { h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  icon: "fsg-LightboxArrow-icon"
} as const;

export type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  onClick: () => void;
}

const LABELS: Readonly<Record<LightboxArrowDirection, string>> = { previous: "Previous", next: "Next" };

export function LightboxArrow({ direction, onClick }: LightboxArrowProps): HTMLElement {
  return (
    <button className={LightboxArrowClass.root} type="button" aria-label={LABELS[direction]} dataset={{ direction }} onClick={() => onClick()}>
      <span className={LightboxArrowClass.icon} aria-hidden="true" />
    </button>
  );
}
