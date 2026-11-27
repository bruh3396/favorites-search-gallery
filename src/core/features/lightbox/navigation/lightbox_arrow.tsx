import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Reactive, h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  plate: "fsg-LightboxArrow-plate",
  icon: "fsg-LightboxArrow-icon"
} as const;

type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  label: string;
  title: Reactive<string>;
  onClick: () => void;
}

const ICONS: Readonly<Record<LightboxArrowDirection, Icon>> = { previous: "chevronLeftLarge", next: "chevronRightLarge" };

export function LightboxArrow({ direction: lightboxArrowDirection, label, title, onClick }: LightboxArrowProps): HTMLElement {
  return (
    <button
      className={LightboxArrowClass.root}
      type="button"
      aria-label={label}
      title={title}
      onClick={() => onClick()}
    >
      <span className={LightboxArrowClass.plate}>{createIcon(ICONS[lightboxArrowDirection], LightboxArrowClass.icon)}</span>
    </button>
  ) as HTMLElement;
}
