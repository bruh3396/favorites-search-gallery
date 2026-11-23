import { h } from "@/core/ui/h/h";

export const TextButtonClass = {
  root: "fsg-TextButton"
} as const;

export interface TextButtonProps {
  label: string;
  onClick: () => void;
}

export function TextButton({ label, onClick }: TextButtonProps): HTMLElement {
  return (
    <button className={TextButtonClass.root} type="button" onPointerdown={event => event.preventDefault()} onClick={onClick}>
      {label}
    </button>
  );
}
