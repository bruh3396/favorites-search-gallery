import { Child, Reactive, h } from "@/core/ui/h/h";
import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, computed } from "@/core/utils/reactive/signal";

export const IconButtonClass = {
  root: "fsg-IconButton",
  icon: "fsg-IconButton-icon"
} as const;

export interface IconButtonProps {
  icon: Icon;
  label: Reactive<string>;
  pressed?: Readable<boolean>;
  onClick: () => void;
  children?: Child;
}

export function IconButton({ icon, label, pressed, onClick, children }: IconButtonProps): HTMLElement {
  return (
    <button
      className={IconButtonClass.root}
      type="button"
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : computed(() => String(pressed.value))}
      onClick={onClick}
    >
      {createIcon(icon, IconButtonClass.icon)}
      {children}
    </button>
  );
}
