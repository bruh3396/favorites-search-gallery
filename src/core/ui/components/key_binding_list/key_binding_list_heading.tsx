import { h } from "@/core/ui/h/h";

export const KeyBindingListHeadingClass = {
  root: "fsg-KeyBindingListHeading"
} as const;

export interface KeyBindingListHeadingProps {
  title: string;
}

export function KeyBindingListHeading({ title }: KeyBindingListHeadingProps): HTMLElement {
  return <h3 className={KeyBindingListHeadingClass.root}>{title}</h3>;
}
