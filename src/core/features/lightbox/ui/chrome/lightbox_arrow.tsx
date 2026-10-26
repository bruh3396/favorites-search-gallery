import { LightboxShortcut } from "@/core/features/lightbox/input/lightbox_shortcut_finder";
import { createLightboxIcon } from "@/core/features/lightbox/ui/chrome/lightbox_icon";
import { h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  plate: "fsg-LightboxArrow-plate",
  icon: "fsg-LightboxArrow-icon"
} as const;

export type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  shortcut?: LightboxShortcut;
  onClick: () => void;
}

const LABELS: Readonly<Record<LightboxArrowDirection, string>> = { previous: "Previous", next: "Next" };

export function LightboxArrow({ direction, shortcut, onClick }: LightboxArrowProps): HTMLElement {
  const plate = (<span className={LightboxArrowClass.plate} />) as HTMLElement;
  const label = LABELS[direction];

  plate.append(createLightboxIcon(plate.ownerDocument, direction, LightboxArrowClass.icon));
  return (
    <button
      className={LightboxArrowClass.root}
      type="button"
      aria-label={label}
      aria-keyshortcuts={shortcut?.ariaName ?? null}
      title={shortcut === undefined ? label : `${label} (${shortcut.text})`}
      onClick={() => onClick()}
    >
      {plate}
    </button>
  ) as HTMLElement;
}
