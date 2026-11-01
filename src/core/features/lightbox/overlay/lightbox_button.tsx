import { LightboxIcon, createLightboxIcon } from "@/core/features/lightbox/overlay/lightbox_icon";
import { Reactive, h } from "@/core/ui/h/h";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";

export const LightboxButtonClass = {
  root: "fsg-LightboxButton",
  icon: "fsg-LightboxButton-icon"
} as const;

export interface LightboxButtonProps {
  icon: Reactive<LightboxIcon>;
  label: string;
  lightboxShortcut?: LightboxShortcut;
  pressed?: Readable<boolean>;
  disabled?: Reactive<boolean>;
  onClick: () => void;
}

export function LightboxButton({ icon, label, lightboxShortcut, pressed, disabled = false, onClick }: LightboxButtonProps): HTMLElement {
  const button = (
    <button
      className={LightboxButtonClass.root}
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed === undefined ? null : computed(() => String(pressed.value))}
      aria-keyshortcuts={lightboxShortcut?.ariaName ?? null}
      title={lightboxShortcut === undefined ? label : `${label} (${lightboxShortcut.text})`}
      onClick={() => onClick()}
    />
  ) as HTMLElement;

  effect(() => {
    const shown = typeof icon === "string" ? icon : icon.value;

    button.replaceChildren(createLightboxIcon(button.ownerDocument, shown, LightboxButtonClass.icon));
  });
  return button;
}
