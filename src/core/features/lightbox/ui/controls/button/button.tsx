import { LIGHTBOX_ICON_PATHS, LightboxIcon } from "@/core/features/lightbox/ui/controls/button/icons";
import { Reactive, h } from "@/core/ui/h/h";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";

export const LightboxButtonClass = {
  root: "fsg-LightboxButton",
  icon: "fsg-LightboxButton-icon"
} as const;

export interface LightboxButtonProps {
  icon: Reactive<LightboxIcon>;
  label: string;
  pressed?: Readable<boolean>;
  hidden?: Readable<boolean>;
  onClick: () => void;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function LightboxButton({ icon, label, pressed, hidden, onClick }: LightboxButtonProps): HTMLElement {
  const readIcon = (): LightboxIcon => (typeof icon === "string" ? icon : icon.value);
  const button = (
    <button
      className={LightboxButtonClass.root}
      type="button"
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : computed(() => String(pressed.value))}
      title={label}
      hidden={hidden ?? false}
      dataset={{ icon: computed(readIcon) }}
      onClick={() => onClick()}
    />
  );

  button.append(createIcon(button.ownerDocument, readIcon));
  return button;
}

function createIcon(ownerDocument: Document, readIcon: () => LightboxIcon): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("class", LightboxButtonClass.icon);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.append(path);
  effect(() => path.setAttribute("d", LIGHTBOX_ICON_PATHS[readIcon()]));
  return svg;
}
