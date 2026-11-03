import { Child, Reactive, h } from "@/core/ui/h/h";
import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, computed } from "@/core/utils/reactive/signal";

export const IconButtonClass = {
  root: "fsg-IconButton",
  icon: "fsg-IconButton-icon"
} as const;

type IconButtonSize = "small" | "medium" | "large";

export interface IconButtonProps {
  icon: Reactive<Icon>;
  label: Reactive<string>;
  size?: IconButtonSize;
  type?: "button" | "submit";
  pressed?: Readable<boolean>;
  disabled?: Reactive<boolean>;
  className?: string;
  onClick?: () => void;
  children?: Child;
}

export function IconButton({
  icon, label, size: iconButtonSize = "medium", type = "button", pressed, disabled, className, onClick, children
}: IconButtonProps): HTMLElement {
  return (
    <button
      className={className === undefined ? IconButtonClass.root : `${IconButtonClass.root} ${className}`}
      type={type}
      data-size={iconButtonSize}
      aria-label={label}
      title={label}
      aria-pressed={pressed === undefined ? undefined : computed(() => String(pressed.value))}
      disabled={disabled}
      onClick={onClick}
    >
      {createIcon(icon, IconButtonClass.icon)}
      {children}
    </button>
  );
}
