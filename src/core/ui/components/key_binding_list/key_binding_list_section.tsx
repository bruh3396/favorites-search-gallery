import { Child, h } from "@/core/ui/h/h";

export const KeyBindingListSectionClass = {
  root: "fsg-KeyBindingListSection"
} as const;

export interface KeyBindingListSectionProps {
  children?: Child;
}

export function KeyBindingListSection({ children }: KeyBindingListSectionProps): HTMLElement {
  return <div className={KeyBindingListSectionClass.root}>{children}</div>;
}
