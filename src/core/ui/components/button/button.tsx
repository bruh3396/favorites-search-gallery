import { Reactive, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";

export const ButtonClass = {
  root: "fsg-Button"
} as const;

type ButtonEmphasis = "outlined" | "filled" | "destructive";

export interface ButtonProps {
  label: Reactive<string>;
  emphasis?: ButtonEmphasis;
  pressed?: Readable<boolean>;
  disabled?: Reactive<boolean>;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
}

export function Button({
  label, emphasis: buttonEmphasis = "outlined", pressed, disabled, type = "button", className, onClick
}: ButtonProps): HTMLElement {
  return (
    <button
      className={className === undefined ? ButtonClass.root : `${ButtonClass.root} ${className}`}
      type={type}
      data-emphasis={buttonEmphasis}
      aria-pressed={pressed === undefined ? undefined : computed(() => String(pressed.value))}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
