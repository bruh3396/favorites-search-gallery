import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  plate: "fsg-LightboxArrow-plate",
  icon: "fsg-LightboxArrow-icon"
} as const;

type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  onClick: () => void;
}

const LABELS: Readonly<Record<LightboxArrowDirection, string>> = { previous: "Previous", next: "Next" };
const ICONS: Readonly<Record<LightboxArrowDirection, Icon>> = { previous: "chevronLeftLarge", next: "chevronRightLarge" };

export function LightboxArrow({ direction: lightboxArrowDirection, onClick }: LightboxArrowProps): HTMLElement {
  const label = LABELS[lightboxArrowDirection];
  return (
    <button
      className={LightboxArrowClass.root}
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onClick()}
    >
      <span className={LightboxArrowClass.plate}>{createIcon(ICONS[lightboxArrowDirection], LightboxArrowClass.icon)}</span>
    </button>
  ) as HTMLElement;
}
