import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Reactive, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";

export const LightboxButtonClass = {
  root: "fsg-LightboxButton",
  icon: "fsg-LightboxButton-icon"
} as const;

export interface LightboxButtonProps {
  icon: Reactive<Icon>;
  label: Reactive<string>;
  title?: Reactive<string>;
  pressed?: Readable<boolean>;
  disabled?: Reactive<boolean>;
  onClick?: () => void;
}

export function LightboxButton({ icon, label, title = label, pressed, disabled = false, onClick }: LightboxButtonProps): HTMLElement {
  return (
    <button
      className={LightboxButtonClass.root}
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed === undefined ? null : computed(() => String(pressed.value))}
      title={title}
      onClick={() => onClick?.()}
    >
      {createIcon(icon, LightboxButtonClass.icon)}
    </button>
  ) as HTMLElement;
}
