import { Readable } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const StatusTextClass = {
  root: "fsg-StatusText"
} as const;

export interface StatusTextOptions {
  text: Readable<string>;
}

export function StatusText({ text }: StatusTextOptions): HTMLElement {
  return <div className={StatusTextClass.root} role="status">{text}</div>;
}
