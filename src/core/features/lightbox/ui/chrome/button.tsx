import { LightboxIcon, createLightboxIcon } from "@/core/features/lightbox/ui/chrome/icon";
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
  disabled?: Reactive<boolean>;
  onClick: () => void;
}

export function LightboxButton({ icon, label, pressed, disabled = false, onClick }: LightboxButtonProps): HTMLElement {
  const button = (
    <button
      className={LightboxButtonClass.root}
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed === undefined ? null : computed(() => String(pressed.value))}
      title={label}
      onClick={() => onClick()}
    />
  ) as HTMLElement;

  effect(() => {
    const shown = typeof icon === "string" ? icon : icon.value;

    button.replaceChildren(createLightboxIcon(button.ownerDocument, shown, LightboxButtonClass.icon));
  });
  return button;
}
