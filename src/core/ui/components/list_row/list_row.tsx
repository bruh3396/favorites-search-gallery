import { Child, h } from "@/core/ui/h/h";

export const ListRowClass = {
  root: "fsg-ListRow"
} as const;

export interface ListRowProps {
  className?: string;
  onMousedown?: (event: MouseEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onFocusout?: (event: FocusEvent) => void;
  children?: Child;
}

export function ListRow({ className, onMousedown, onClick, onFocusout, children }: ListRowProps): HTMLElement {
  return (
    <div
      className={className === undefined ? ListRowClass.root : `${ListRowClass.root} ${className}`}
      onMousedown={onMousedown}
      onClick={onClick}
      onFocusout={onFocusout}
    >
      {children}
    </div>
  );
}
