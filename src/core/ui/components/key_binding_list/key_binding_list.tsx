import { Child, h } from "@/core/ui/h/h";

export const KeyBindingListClass = {
  root: "fsg-KeyBindingList"
} as const;

export interface KeyBindingListProps {
  children?: Child;
}

export function KeyBindingList({ children }: KeyBindingListProps): HTMLElement {
  return <div className={KeyBindingListClass.root}>{children}</div>;
}
