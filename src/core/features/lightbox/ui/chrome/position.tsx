import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxShortcut } from "@/core/features/lightbox/input/shortcut";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { createLightboxIcon } from "@/core/features/lightbox/ui/chrome/icon";
import { h } from "@/core/ui/h/h";

export const LightboxPositionClass = {
  root: "fsg-LightboxPosition",
  button: "fsg-LightboxPosition-button",
  icon: "fsg-LightboxPosition-icon"
} as const;

export interface LightboxPositionToggle {
  isOn: Readable<boolean>;
  label: string;
  shortcut?: LightboxShortcut;
  onClick: () => void;
}

export interface LightboxPositionProps {
  position: Readable<SequencePosition | undefined>;
  toggle?: LightboxPositionToggle;
}

export function LightboxPosition({ position, toggle }: LightboxPositionProps): HTMLElement {
  const text = computed(() => formatPosition(position.value));

  if (toggle === undefined) {
    return <span className={LightboxPositionClass.root}>{text}</span> as HTMLElement;
  }
  const button = (
    <button
      className={`${LightboxPositionClass.root} ${LightboxPositionClass.button}`}
      type="button"
      aria-pressed={computed(() => String(toggle.isOn.value))}
      aria-keyshortcuts={toggle.shortcut?.ariaName ?? null}
      title={toggle.shortcut === undefined ? toggle.label : `${toggle.label} (${toggle.shortcut.text})`}
      onClick={() => toggle.onClick()}
    >
      {text}
    </button>
  ) as HTMLElement;

  button.append(createLightboxIcon(button.ownerDocument, "info", LightboxPositionClass.icon));
  return button;
}

function formatPosition(position: SequencePosition | undefined): string {
  if (position === undefined) {
    return "";
  }
  const shown = (position.index + 1).toLocaleString();
  return position.total === undefined ? shown : `${shown} / ${position.total.toLocaleString()}`;
}
