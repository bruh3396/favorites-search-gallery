import { LightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";
import { createLightboxIcon } from "@/core/features/lightbox/overlay/lightbox_icon";
import { h } from "@/core/ui/h/h";

export const LightboxArrowClass = {
  root: "fsg-LightboxArrow",
  plate: "fsg-LightboxArrow-plate",
  icon: "fsg-LightboxArrow-icon"
} as const;

export type LightboxArrowDirection = "previous" | "next";

export interface LightboxArrowProps {
  direction: LightboxArrowDirection;
  lightboxShortcut?: LightboxShortcut;
  onClick: () => void;
}

const LABELS: Readonly<Record<LightboxArrowDirection, string>> = { previous: "Previous", next: "Next" };

export function LightboxArrow({ direction: lightboxArrowDirection, lightboxShortcut, onClick }: LightboxArrowProps): HTMLElement {
  const plate = (<span className={LightboxArrowClass.plate} />) as HTMLElement;
  const label = LABELS[lightboxArrowDirection];

  plate.append(createLightboxIcon(plate.ownerDocument, lightboxArrowDirection, LightboxArrowClass.icon));
  return (
    <button
      className={LightboxArrowClass.root}
      type="button"
      aria-label={label}
      aria-keyshortcuts={lightboxShortcut?.ariaName ?? null}
      title={label}
      onClick={() => onClick()}
    >
      {plate}
    </button>
  ) as HTMLElement;
}
