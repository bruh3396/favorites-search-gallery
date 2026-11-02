import { h } from "@/core/ui/h/h";

export const KeyCapClass = {
  root: "fsg-KeyCap"
} as const;

export interface KeyCapProps {
  label: string;
}

export function KeyCap({ label }: KeyCapProps): HTMLElement {
  return <kbd className={KeyCapClass.root}>{label}</kbd>;
}
